import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  questionsTable as questions,
  questionBlanksTable as blanks,
} from "@workspace/db";
import type { PracticeSet } from "../data/patternpilot";
import type { PracticeSet as PublicPracticeSet } from "@workspace/api-zod";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export class QuestionDatabaseError extends Error {}
async function databaseOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new QuestionDatabaseError("Question database operation failed", {
      cause: error,
    });
  }
}

const displayFields = {
  id: blanks.publicId,
  order: blanks.position,
  prefix: blanks.prefix,
  missingLength: blanks.missingLength,
};
const gradingFields = {
  ...displayFields,
  fullWord: blanks.fullWord,
  answer: blanks.correctAnswer,
  lemma: sql<string>`coalesce(${blanks.lemma}, '')`,
  partOfSpeech: sql<string>`coalesce(${blanks.partOfSpeech}, '')`,
  wordFamily: sql<string>`coalesce(${blanks.wordFamily}, '')`,
  root: sql<string>`coalesce(${blanks.root}, '')`,
  suffix: sql<string>`coalesce(${blanks.suffix}, '')`,
  errorCategory: sql<string>`coalesce(${blanks.errorCategory}, '')`,
  tags: blanks.tags,
};

export async function listPublicQuestions(): Promise<PublicPracticeSet[]> {
  return databaseOperation(() =>
    db.transaction(
      async (tx) => {
        const rows = await tx
          .select()
          .from(questions)
          .where(eq(questions.published, true))
          .orderBy(asc(questions.displayOrder), asc(questions.publicId));
        if (!rows.length) return [];
        const children = await tx
          .select({ questionId: blanks.questionId, ...displayFields })
          .from(blanks)
          .where(
            inArray(
              blanks.questionId,
              rows.map((q) => q.id),
            ),
          )
          .orderBy(asc(blanks.position));
        return rows.map((q) => ({
          id: q.publicId,
          title: q.title,
          topic: q.topic,
          difficulty: q.difficulty,
          estimatedMinutes: q.estimatedMinutes,
          passage: q.passage,
          blanks: children
            .filter((b) => b.questionId === q.id)
            .map(({ questionId: _id, ...b }) => b),
          blankCount: children.filter((b) => b.questionId === q.id).length,
        }));
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    ),
  );
}

export async function readQuestions(
  filter: { ids?: string[]; search?: string; published?: boolean } = {},
): Promise<PracticeSet[]> {
  if (filter.ids?.length === 0) return [];
  return databaseOperation(() =>
    db.transaction(
      async (tx) => {
        const rows = await tx
          .select()
          .from(questions)
          .where(
            and(
              filter.ids ? inArray(questions.publicId, filter.ids) : undefined,
              filter.published === undefined
                ? undefined
                : eq(questions.published, filter.published),
              filter.search
                ? sql`strpos(lower(${questions.title} || ' ' || ${questions.topic}), lower(${filter.search})) > 0`
                : undefined,
            ),
          )
          .orderBy(asc(questions.displayOrder), asc(questions.publicId));
        if (!rows.length) return [];
        const children = await tx
          .select({ questionId: blanks.questionId, ...gradingFields })
          .from(blanks)
          .where(
            inArray(
              blanks.questionId,
              rows.map((q) => q.id),
            ),
          )
          .orderBy(asc(blanks.position));
        return rows.map((q) => ({
          id: q.publicId,
          title: q.title,
          topic: q.topic,
          difficulty: q.difficulty,
          estimatedMinutes: q.estimatedMinutes,
          passage: q.passage,
          published: q.published,
          sourceLabel: q.sourceLabel ?? "",
          updatedAt: q.updatedAt.toISOString().slice(0, 10),
          blanks: children
            .filter((b) => b.questionId === q.id)
            .map(({ questionId: _id, ...b }) => b),
          blankCount: children.filter((b) => b.questionId === q.id).length,
        }));
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    ),
  );
}

async function insertQuestion(
  tx: Transaction,
  set: PracticeSet,
  displayOrder: number,
) {
  const [question] = await tx
    .insert(questions)
    .values({
      publicId: set.id,
      title: set.title,
      topic: set.topic,
      difficulty: set.difficulty,
      passage: set.passage,
      published: set.published,
      sourceLabel: set.sourceLabel,
      updatedAt: new Date(set.updatedAt),
      estimatedMinutes: set.estimatedMinutes,
      displayOrder,
    })
    .returning();
  if (set.blanks.length)
    await tx
      .insert(blanks)
      .values(
        set.blanks.map((b) => ({
          publicId: b.id,
          questionId: question.id,
          position: b.order,
          prefix: b.prefix,
          missingLength: b.missingLength,
          correctAnswer: b.answer,
          fullWord: b.fullWord,
          lemma: b.lemma,
          partOfSpeech: b.partOfSpeech,
          wordFamily: b.wordFamily,
          root: b.root,
          suffix: b.suffix,
          errorCategory: b.errorCategory,
          tags: b.tags,
        })),
      );
}

/** A single lock orders admin batches and seed runs without MAX()+1 races. */
export async function createQuestions(sets: PracticeSet[]): Promise<void> {
  if (!sets.length) return;
  return databaseOperation(() =>
    db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(731903)`);
      const [last] = await tx
        .select({
          value: sql<number>`coalesce(max(${questions.displayOrder}), 0)::integer`,
        })
        .from(questions);
      for (const [index, set] of sets.entries())
        await insertQuestion(tx, set, last.value + index + 1);
    }),
  );
}

/** Insert-only seed: reruns never overwrite administrator content. */
export async function seedQuestions(
  sets: PracticeSet[],
): Promise<{ inserted: number; existing: number }> {
  return databaseOperation(() =>
    db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(731903)`);
      const [last] = await tx
        .select({
          value: sql<number>`coalesce(max(${questions.displayOrder}), 0)::integer`,
        })
        .from(questions);
      let position = last.value,
        inserted = 0,
        existing = 0;
      for (const set of sets) {
        const [found] = await tx
          .select()
          .from(questions)
          .where(eq(questions.publicId, set.id));
        if (found) {
          const stored = await tx
            .select({ id: blanks.publicId })
            .from(blanks)
            .where(eq(blanks.questionId, found.id));
          const expected = set.blanks.map((b) => b.id).sort();
          if (
            JSON.stringify(stored.map((b) => b.id).sort()) !==
            JSON.stringify(expected)
          )
            throw new Error(`Incomplete seed record: ${set.id}`);
          existing++;
          continue;
        }
        await insertQuestion(tx, set, ++position);
        inserted++;
      }
      return { inserted, existing };
    }),
  );
}
