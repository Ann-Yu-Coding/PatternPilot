import assert from "node:assert/strict";
import { it } from "node:test";
import { seedPracticeSets } from "../data/practice-question-seed";
import { scorePracticeAnswers } from "./practice-scoring";

it("gives each original blank specific feedback for both correct and missing answers", () => {
  const explanations = new Set<string>();
  for (const set of seedPracticeSets) {
    const correct = scorePracticeAnswers(
      set.blanks,
      set.blanks.map((b) => ({ blankId: b.id, value: b.answer })),
    );
    const skipped = scorePracticeAnswers(set.blanks, []);
    correct.forEach((item, index) => {
      assert.equal(item.isCorrect, true);
      assert.equal(skipped[index].isCorrect, false);
      assert.equal(item.explanation, skipped[index].explanation);
      assert.equal(item.errorCategory, set.blanks[index].errorCategory);
      assert.match(item.explanation, /“.+”/);
      assert.ok(!item.explanation.includes("The complete word is"));
      explanations.add(item.explanation);
    });
  }
  assert.equal(explanations.size, 24);
});

it("does not reuse original feedback when an answer is edited", () => {
  const blank = {
    ...seedPracticeSets[0].blanks[0],
    fullWord: "changed",
    answer: "changed",
  };
  assert.equal(
    scorePracticeAnswers([blank], [])[0].explanation,
    "The complete word is changed.",
  );
});
