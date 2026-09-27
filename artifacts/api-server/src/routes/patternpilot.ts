import { Router, type IRouter } from "express";
import {
  CreateAdminQuestionBody,
  GetDashboardSummaryResponse,
  GetTargetedTrainingParams,
  GetTargetedTrainingResponse,
  ImportAdminQuestionsBody,
  ImportAdminQuestionsResponse,
  ListAdminQuestionsQueryParams,
  ListPracticeSetsResponse,
  ListAdminQuestionsResponse,
  StartPracticeSessionBody,
  StartPracticeSessionResponse,
  SubmitPracticeSessionBody,
  SubmitPracticeSessionParams,
  SubmitPracticeSessionResponse,
  SubmitTrainingDrillBody,
  SubmitTrainingDrillParams,
  SubmitTrainingDrillResponse,
} from "@workspace/api-zod";
import {
  bindBlanksToSet,
  findSet,
  newId,
  practiceSets,
  sessions,
  type Blank,
  type PracticeSet,
} from "../data/patternpilot";
import { diagnoseAttempts, getLearningContent, toTrainingSet } from "../services/diagnosis";
import { getStoredContentForWeaknesses, getStoredLearningContent } from "../services/learning-content-repository";
import { scorePracticeAnswers } from "../services/practice-scoring";

const router: IRouter = Router();

const toPublicSet = (set: PracticeSet) => ({
  id: set.id,
  title: set.title,
  topic: set.topic,
  difficulty: set.difficulty,
  estimatedMinutes: set.estimatedMinutes,
  blankCount: set.blankCount,
  passage: set.passage,
  blanks: set.blanks,
});

router.get("/practice/sets", (_req, res) => {
  res.json(ListPracticeSetsResponse.parse(practiceSets.filter((set) => set.published).map(toPublicSet)));
});

router.post("/practice/sessions", (req, res) => {
  const body = StartPracticeSessionBody.parse(req.body);
  const session = { id: newId(), setIds: body.setIds, startedAt: new Date().toISOString() };
  sessions.set(session.id, session);
  res.status(201).json(StartPracticeSessionResponse.parse(session));
});

router.post("/practice/sessions/:sessionId/submit", async (req, res) => {
  const { sessionId } = SubmitPracticeSessionParams.parse(req.params);
  const body = SubmitPracticeSessionBody.parse(req.body);
  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const blanks = session.setIds.flatMap((setId) => findSet(setId)?.blanks ?? []);
  const items = scorePracticeAnswers(blanks, body.answers);
  const diagnosedWeaknesses = diagnoseAttempts(items.map((item, index) => ({
    blank: blanks[index],
    submitted: item.submitted,
    isCorrect: item.isCorrect,
  })));
  const weaknesses = await getStoredContentForWeaknesses(diagnosedWeaknesses);
  const topWeakness = weaknesses[0] ?? {
    key: "contextual-prediction",
    label: "Contextual Prediction",
    count: 0,
    score: 0,
    detail: "Keep using the sentence around the blank to confirm each form.",
    evidence: [],
    learningTitle: "Let the sentence narrow the choice",
    learningDescription: "Read the clause, locate the signal word, and predict the part of speech before checking the letters.",
    drillCount: getLearningContent("contextual-prediction").prompts.length,
  };
  session.weaknessKey = topWeakness.key;
  const score = items.filter((item) => item.isCorrect).length;
  const result = {
    sessionId,
    score,
    total: items.length,
    accuracy: items.length ? Math.round((score / items.length) * 100) : 0,
    items,
    topWeakness,
    weaknesses,
    reviewCopy:
      score === items.length
        ? "Excellent control. You completed both passages without losing a point."
        : `Your answers show a clear pattern: ${topWeakness.detail.toLowerCase()}`,
  };
  res.json(SubmitPracticeSessionResponse.parse(result));
});

router.post("/practice/sessions/:sessionId/training", async (req, res) => {
  const { sessionId } = SubmitTrainingDrillParams.parse(req.params);
  SubmitTrainingDrillBody.parse(req.body);
  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const drill = await getStoredLearningContent(session.weaknessKey);
  const answers = req.body.answers as Array<{ blankId: string; value: string }>;
  const items = drill.prompts.map((prompt) => {
    const submitted = answers.find((answer) => answer.blankId === prompt.id)?.value ?? "";
    const isCorrect = submitted.trim().toLowerCase() === prompt.answer.toLowerCase();
    return {
      blankId: prompt.id,
      submitted,
      fullWord: prompt.prefix + prompt.answer,
      isCorrect,
      errorCategory: "word formation",
      suffix: prompt.answer,
      wordFamily: prompt.prompt.split(" → ")[0],
      explanation: isCorrect ? "Correct pattern." : prompt.hint,
    };
  });
  const score = items.filter((item) => item.isCorrect).length;
  res.json(
    SubmitTrainingDrillResponse.parse({
      score,
      total: items.length,
      accuracy: Math.round((score / items.length) * 100),
      items,
      lockedInsights: ["Academic vocabulary — 5 issues detected", "Function words — 3 issues detected", "Spelling patterns — 4 issues detected"],
    }),
  );
});

router.get("/practice/sessions/:sessionId/training", async (req, res) => {
  const { sessionId } = GetTargetedTrainingParams.parse(req.params);
  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const training = toTrainingSet(await getStoredLearningContent(session.weaknessKey));
  res.json(GetTargetedTrainingResponse.parse(training));
});

router.get("/dashboard", (_req, res) => {
  res.json(
    GetDashboardSummaryResponse.parse({
      questionsCompleted: 16,
      accuracy: 74,
      reviewCount: 8,
      streak: 3,
      topWeaknesses: [
        { key: "noun-formation", label: "Noun Formation", count: 5, detail: "Noun endings and related forms", score: 15, evidence: [], learningTitle: "Notice when the sentence needs a noun", learningDescription: "Use the words around the blank to identify a noun-forming ending.", drillCount: 4 },
        { key: "academic-vocabulary", label: "Academic Vocabulary", count: 4, detail: "High-frequency academic words", score: 8, evidence: [], learningTitle: "Build faster academic retrieval", learningDescription: "Use context and word families to retrieve academic vocabulary faster.", drillCount: 3 },
        { key: "spelling", label: "Spelling", count: 3, detail: "Letter patterns and doubles", score: 6, evidence: [], learningTitle: "Slow down around letter patterns", learningDescription: "Build a reliable letter-by-letter check before you submit.", drillCount: 4 },
      ],
      recentAccuracy: [
        { label: "Sep 21", value: 61 },
        { label: "Sep 23", value: 68 },
        { label: "Sep 25", value: 74 },
      ],
    }),
  );
});

router.get("/admin/questions", (req, res) => {
  const query = ListAdminQuestionsQueryParams.parse(req.query);
  const results = practiceSets.filter((set) => {
    const matchesSearch =
      !query.search ||
      `${set.title} ${set.topic}`.toLowerCase().includes(query.search.toLowerCase());
    const matchesPublished =
      query.published === undefined || set.published === query.published;
    return matchesSearch && matchesPublished;
  });
  res.json(ListAdminQuestionsResponse.parse(results.map((set) => ({ ...toPublicSet(set), published: set.published, sourceLabel: set.sourceLabel, updatedAt: set.updatedAt }))));
});

router.post("/admin/questions", (req, res) => {
  const body = CreateAdminQuestionBody.parse(req.body);
  const id = newId();
  const bound = bindBlanksToSet(id, body.passage, body.blanks as Blank[]);
  const newQuestion: PracticeSet = {
    id,
    title: body.title,
    topic: body.topic,
    difficulty: body.difficulty,
    estimatedMinutes: 7,
    blankCount: bound.blanks.length,
    passage: bound.passage,
    blanks: bound.blanks,
    published: body.published ?? false,
    sourceLabel: body.sourceLabel ?? "Admin import",
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  practiceSets.push(newQuestion);
  res.status(201).json({
    ...toPublicSet(newQuestion),
    published: newQuestion.published,
    sourceLabel: newQuestion.sourceLabel,
    updatedAt: newQuestion.updatedAt,
  });
});

router.post("/admin/questions/import", (req, res) => {
  const body = ImportAdminQuestionsBody.parse(req.body);
  let imported = 0;
  let skipped = 0;
  try {
    const rows =
      body.format === "json"
        ? (JSON.parse(body.raw) as unknown[])
        : body.raw.split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
            const [title, topic, difficulty, passage] = line.split(",").map((value) => value.trim());
            return { title, topic, difficulty, passage, blanks: [] };
          });
    for (const row of rows) {
      if (!row || typeof row !== "object" || !("title" in row) || !("passage" in row)) {
        skipped++;
        continue;
      }
      const candidate = row as Partial<PracticeSet>;
      if (typeof candidate.title !== "string" || typeof candidate.passage !== "string") {
        skipped++;
        continue;
      }
      const id = newId();
      const blanks = Array.isArray(candidate.blanks) ? (candidate.blanks as Blank[]) : [];
      const bound = bindBlanksToSet(id, candidate.passage, blanks);
      practiceSets.push({
        id,
        title: candidate.title,
        topic: candidate.topic ?? "Uncategorized",
        difficulty: candidate.difficulty ?? "Core",
        estimatedMinutes: 7,
        blankCount: bound.blanks.length,
        passage: bound.passage,
        blanks: bound.blanks,
        published: false,
        sourceLabel: "Imported",
        updatedAt: new Date().toISOString().slice(0, 10),
      });
      imported++;
    }
  } catch {
    skipped++;
  }
  res.json(
    ImportAdminQuestionsResponse.parse({
      imported,
      skipped,
      message: imported ? `Imported ${imported} question${imported === 1 ? "" : "s"}.` : "No valid questions were imported.",
    }),
  );
});

export default router;