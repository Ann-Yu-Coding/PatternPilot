import { seedPracticeSets as practiceSets } from "./practice-question-seed";
const findSet = (id: string) => practiceSets.find(set => set.id === id);
const allBlankIds = () => practiceSets.flatMap(set => set.blanks.map(blank => blank.id));
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bindBlanksToSet,
  blankToken,
  makeBlankId,
} from "./patternpilot";
import { scorePracticeAnswers } from "../services/practice-scoring";
import { getLearningContent, toTrainingSet } from "../services/diagnosis";
import { GetTargetedTrainingResponse } from "@workspace/api-zod";

describe("blank id uniqueness", () => {
  it("makes globally unique ids with set prefix", () => {
    assert.equal(makeBlankId("set-ecology", "b1"), "set-ecology__b1");
    assert.equal(makeBlankId("set-memory", "b1"), "set-memory__b1");
    assert.equal(makeBlankId("set-ecology", "set-ecology__b1"), "set-ecology__b1");
  });

  it("ensures every blank id across seed sets is unique", () => {
    const ids = allBlankIds();
    assert.equal(ids.length, 24);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("keeps passage tokens aligned with blank ids", () => {
    for (const set of practiceSets) {
      for (const blank of set.blanks) {
        assert.ok(
          set.passage.includes(blankToken(blank.id)),
          `expected ${blank.id} token in ${set.id} passage`,
        );
      }
      const tokens = [...set.passage.matchAll(/\{\{([^}]+)\}\}/g)].map((match) => match[1]);
      assert.deepEqual(tokens, set.blanks.map((blank) => blank.id));
    }
  });

  it("rewrites local passage tokens when binding blanks to a new set", () => {
    const bound = bindBlanksToSet("imported-1", "Hello {{b1}} world {{b2}}.", [
      {
        id: "b1",
        order: 1,
        prefix: "Hel",
        missingLength: 2,
        fullWord: "Hello",
        answer: "lo",
        lemma: "hello",
        partOfSpeech: "noun",
        wordFamily: "hello",
        root: "hello",
        suffix: "",
        errorCategory: "spelling",
        tags: [],
      },
      {
        id: "b2",
        order: 2,
        prefix: "wor",
        missingLength: 2,
        fullWord: "world",
        answer: "ld",
        lemma: "world",
        partOfSpeech: "noun",
        wordFamily: "world",
        root: "world",
        suffix: "",
        errorCategory: "spelling",
        tags: [],
      },
    ]);
    assert.equal(bound.blanks[0].id, "imported-1__b1");
    assert.equal(bound.blanks[1].id, "imported-1__b2");
    assert.equal(bound.passage, "Hello {{imported-1__b1}} world {{imported-1__b2}}.");
  });
});

describe("multi-set scoring with unique blank ids", () => {
  it("scores answers from two sets without id collisions", () => {
    const ecology = findSet("set-ecology");
    const memory = findSet("set-memory");
    assert.ok(ecology && memory);

    const blanks = [...ecology.blanks, ...memory.blanks];
    assert.equal(new Set(blanks.map((blank) => blank.id)).size, blanks.length);

    const mixedAnswers = blanks.map((blank) => ({
      blankId: blank.id,
      value: blank.id.startsWith("set-ecology__") ? blank.answer : "xxxx",
    }));

    const scored = scorePracticeAnswers(blanks, mixedAnswers);
    assert.equal(scored.length, 16);
    assert.equal(scored.filter((item) => item.isCorrect).length, 8);

    const ecologyFirst = scored.find((item) => item.blankId === "set-ecology__b1");
    const memoryFirst = scored.find((item) => item.blankId === "set-memory__b1");
    assert.ok(ecologyFirst && memoryFirst);
    assert.equal(ecologyFirst.fullWord, "independent");
    assert.equal(memoryFirst.fullWord, "record");
    assert.equal(ecologyFirst.isCorrect, true);
    assert.equal(memoryFirst.isCorrect, false);
  });
});

describe("TrainingSet response mapping", () => {
  it("maps learning content onto the OpenAPI TrainingSet contract", () => {
    const content = getLearningContent("noun-formation");
    const training = toTrainingSet(content);
    const parsed = GetTargetedTrainingResponse.parse(training);

    assert.equal(parsed.categoryKey, "noun-formation");
    assert.equal(parsed.title, content.learningTitle);
    assert.equal(parsed.description, content.learningDescription);
    assert.equal(parsed.objective, content.objective);
    assert.equal(parsed.prompts.length, content.prompts.length);
    assert.ok(!("learningTitle" in parsed));
    assert.ok(!("label" in parsed));
  });

  it("rejects the raw LearningContent shape that previously broke GET training", () => {
    const content = getLearningContent("spelling");
    assert.throws(() => GetTargetedTrainingResponse.parse(content));
  });
});

describe("qualified token remapping", () => {
  it("remaps exported qualified tokens", () => {
    const source = practiceSets[0];
    const bound = bindBlanksToSet("copy", source.passage, source.blanks);
    assert.ok(bound.passage.includes("{{copy__b1}}"));
    assert.ok(!bound.passage.includes("set-ecology__"));
  });
  it("rejects duplicate normalized IDs and dangling tokens", () => {
    const blank = practiceSets[0].blanks[0];
    assert.throws(() => bindBlanksToSet("copy", "{{b1}}", [blank, { ...blank, id: "other__b1" }]));
    assert.throws(() => bindBlanksToSet("copy", "{{missing}}", [blank]));
    assert.throws(() => bindBlanksToSet("copy", "{{b1}} {{b1}}", [blank]));
  });
});
