import { pool } from "@workspace/db";
import { seedPracticeSets } from "../data/practice-question-seed";
import { prepareQuestion } from "../services/question-validation";
import { seedQuestions } from "../services/question-repository";

try {
  const sets = seedPracticeSets.map((set) =>
    prepareQuestion(set, {
      id: set.id,
      estimatedMinutes: set.estimatedMinutes,
      updatedAt: set.updatedAt,
    }),
  );
  console.log(await seedQuestions(sets));
} catch (error) {
  console.error(
    "Question seed failed; no changes committed.",
    error instanceof Error ? (error.cause ?? error.message) : "Unknown error",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
