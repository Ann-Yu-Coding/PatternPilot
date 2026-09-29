import { CreateAdminQuestionBody } from "@workspace/api-zod";
import {
  bindBlanksToSet,
  newId,
  type Blank,
  type PracticeSet,
} from "../data/patternpilot";

export class QuestionValidationError extends Error {}

export function prepareQuestion(
  input: unknown,
  options: { id?: string; estimatedMinutes?: number; updatedAt?: string } = {},
): PracticeSet {
  const parsed = CreateAdminQuestionBody.safeParse(input);
  if (!parsed.success)
    throw new QuestionValidationError("Invalid question fields");
  const body = parsed.data;
  const id = options.id ?? newId();
  const positions = new Set<number>();
  const blanks: Blank[] = body.blanks.map((blank) => {
    if (
      !Number.isInteger(blank.order) ||
      blank.order < 1 ||
      positions.has(blank.order)
    )
      throw new QuestionValidationError(
        "Blank positions must be positive and unique",
      );
    positions.add(blank.order);
    if (
      blank.missingLength < 1 ||
      blank.answer.length !== blank.missingLength ||
      blank.prefix + blank.answer !== blank.fullWord
    )
      throw new QuestionValidationError("Inconsistent blank answer or length");
    return {
      ...blank,
      lemma: blank.lemma ?? "",
      partOfSpeech: blank.partOfSpeech ?? "",
      wordFamily: blank.wordFamily ?? "",
      root: blank.root ?? "",
      linguisticPrefix: blank.linguisticPrefix ?? "",
      suffix: blank.suffix ?? "",
    };
  });
  if (body.published && !blanks.length)
    throw new QuestionValidationError("Published questions need blanks");
  const estimatedMinutes = options.estimatedMinutes ?? 7;
  if (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 1)
    throw new QuestionValidationError("Invalid estimated time");
  try {
    const bound = bindBlanksToSet(id, body.passage, blanks);
    return {
      id,
      title: body.title,
      topic: body.topic,
      difficulty: body.difficulty,
      ...bound,
      blanks: bound.blanks.sort((a, b) => a.order - b.order),
      estimatedMinutes,
      blankCount: blanks.length,
      published: body.published ?? false,
      sourceLabel: body.sourceLabel ?? "Admin import",
      updatedAt: options.updatedAt ?? new Date().toISOString().slice(0, 10),
    };
  } catch (error) {
    throw new QuestionValidationError(
      error instanceof Error ? error.message : "Invalid passage tokens",
    );
  }
}

/** Existing four-column CSV format, with quoted commas/newlines and escaped quotes. */
export function parseImportRows(
  format: "json" | "csv",
  raw: string,
): unknown[] {
  if (format === "json") {
    let rows: unknown;
    try {
      rows = JSON.parse(raw);
    } catch {
      throw new QuestionValidationError("Invalid JSON");
    }
    if (!Array.isArray(rows))
      throw new QuestionValidationError("Import must be an array");
    return rows;
  }
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false,
    closed = false;
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (quoted) {
      if (char === '"' && raw[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
        closed = true;
      } else field += char;
    } else if (char === '"' && !field && !closed) quoted = true;
    else if (char === "," || char === "\n" || char === "\r") {
      row.push(field.trim());
      field = "";
      closed = false;
      if (char !== ",") {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (char === "\r" && raw[i + 1] === "\n") i++;
      }
    } else {
      if (char === '"' || (closed && char.trim()))
        throw new QuestionValidationError("Invalid CSV quoting");
      field += char;
    }
  }
  if (quoted) throw new QuestionValidationError("Unclosed CSV quote");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows
    .slice(1)
    .map(([title, topic, difficulty, passage, ...extra]) =>
      extra.length || passage === undefined
        ? null
        : { title, topic, difficulty, passage, blanks: [] },
    );
}

export function prepareImportRow(row: unknown): PracticeSet {
  if (!row || typeof row !== "object" || Array.isArray(row))
    throw new QuestionValidationError("Invalid row");
  const candidate = row as Record<string, unknown>;
  return prepareQuestion({
    ...candidate,
    topic: candidate.topic ?? "Uncategorized",
    difficulty: candidate.difficulty ?? "Core",
    blanks: candidate.blanks ?? [],
    published: false,
    sourceLabel: "Imported",
  });
}
