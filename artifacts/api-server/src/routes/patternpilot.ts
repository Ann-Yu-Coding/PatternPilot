import { createQuestions, listPublicQuestions, readQuestions } from "../services/question-repository";
import { prepareImportRow, prepareQuestion, parseImportRows, QuestionValidationError } from "../services/question-validation";
import { Router, type IRouter } from "express";
import {
  CreateAdminQuestionBody,
  GetDashboardSummaryResponse,
  GetTargetedTrainingParams,
  GetTargetedTrainingQueryParams,
  SubmitTrainingDrillQueryParams,
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
  newId,
  sessions,
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
  blanks: set.blanks.map(({ id, order, prefix, missingLength }) => ({ id, order, prefix, missingLength })),
});

router.get("/practice/sets", async (_req, res) => {
  res.json(ListPracticeSetsResponse.parse(await listPublicQuestions()));
});

router.post("/practice/sessions", async (req, res) => {
  const body = StartPracticeSessionBody.parse(req.body);
  if (new Set(body.setIds).size !== body.setIds.length) throw new QuestionValidationError("Duplicate question IDs");
  const sets = await readQuestions({ ids: body.setIds, published: true });
  if (sets.length !== body.setIds.length) {
    res.status(400).json({ error: "Question unavailable; reload practice" }); return;
  }
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

  const sets = await readQuestions({ ids: session.setIds });
  const byId = new Map(sets.map(set => [set.id, set]));
  if (session.setIds.some(id => !byId.has(id))) {
    res.status(409).json({ error: "Session question unavailable; restart practice" }); return;
  }
  const blanks = session.setIds.flatMap(id => byId.get(id)!.blanks);
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
  const body = SubmitTrainingDrillBody.parse(req.body);
  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const { categoryKey } = SubmitTrainingDrillQueryParams.parse(req.query);
  const drill = await getStoredLearningContent(categoryKey || session.weaknessKey);
  const answers = body.answers;
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
  const { categoryKey } = GetTargetedTrainingQueryParams.parse(req.query);
  const training = toTrainingSet(await getStoredLearningContent(categoryKey || session.weaknessKey));
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

router.get("/admin/questions", async (req, res) => {
  // Avoid z.coerce.boolean() treating the string "false" as true.
  if (req.query.published !== undefined && req.query.published !== "true" && req.query.published !== "false") throw new QuestionValidationError("Invalid published filter");
  const query = ListAdminQuestionsQueryParams.parse({ ...req.query, published: req.query.published === undefined ? undefined : req.query.published === "true" });
  const results = await readQuestions(query);
  res.json(ListAdminQuestionsResponse.parse(results.map(set => ({ ...toPublicSet(set), blanks: set.blanks, published: set.published, sourceLabel: set.sourceLabel, updatedAt: set.updatedAt }))));
});

router.post("/admin/questions", async (req, res) => {
  const body = CreateAdminQuestionBody.parse(req.body);
  const question = prepareQuestion(body);
  await createQuestions([question]);
  res.status(201).json({ ...toPublicSet(question), blanks: question.blanks, published: question.published, sourceLabel: question.sourceLabel, updatedAt: question.updatedAt });
});

router.post("/admin/questions/import", async (req, res) => {
  const body = ImportAdminQuestionsBody.parse(req.body);
  const rows = parseImportRows(body.format, body.raw);
  const valid: PracticeSet[] = [];
  let skipped = 0;
  for (const row of rows) {
    try { valid.push(prepareImportRow(row)); }
    catch (error) { if (error instanceof QuestionValidationError) skipped++; else throw error; }
  }
  await createQuestions(valid);
  const imported = valid.length;
  res.json(ImportAdminQuestionsResponse.parse({ imported, skipped,
    message: imported ? `Imported ${imported} question${imported === 1 ? "" : "s"}.` : "No valid questions were imported." }));
});

export default router;
