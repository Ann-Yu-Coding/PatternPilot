import assert from "node:assert/strict";
import { it } from "node:test";
import {
  classifyAnswer,
  editDistance,
  isEnglishWord,
  type MissCategory,
} from "./classify-answer";
import { seedPracticeSets } from "../data/practice-question-seed";
import type { Blank } from "../data/patternpilot";
import { seedMorphologyUpgrade } from "./seed-morphology-upgrade";
import legacy from "../data/legacy-seed-morphology.json";
import { diagnoseAttempts } from "./diagnosis";
import { scorePracticeAnswers } from "./practice-scoring";
const suggests: Blank = {
  id: "suggests",
  order: 1,
  prefix: "",
  missingLength: 8,
  fullWord: "suggests",
  answer: "suggests",
  lemma: "suggest",
  partOfSpeech: "verb",
  wordFamily: "suggest suggestion suggestive",
  root: "suggest",
  suffix: "s",
  errorCategory: "word formation",
  tags: [],
};
for (const [answer, expected] of [
  ["", "Word retrieval"],
  ["suggest", "Grammar ending"],
  ["suggested", "Grammar ending"],
  ["suggestion", "Word form"],
  ["sugests", "Spelling"],
  ["supports", "Context / meaning"],
  ["sugrom", "Word retrieval"],
  [" SUGGESTS ", null],
] as const)
  it(`§5 suggests / ${JSON.stringify(answer)} → ${expected}`, () =>
    assert.equal(classifyAnswer(suggests, answer), expected));

it("prefix plus trimmed suffix is the contract; an empty suffix stays skipped", () => {
  const b = { ...suggests, prefix: "sugg", answer: "ests" };
  assert.equal(classifyAnswer(b, " ESTS "), null);
  assert.equal(classifyAnswer(b, "est"), "Grammar ending");
  assert.equal(classifyAnswer(b, ""), "Word retrieval");
  assert.notEqual(classifyAnswer(b, "suggests"), null);
});
it("ending-aware nonword larging precedes spelling distance for largely", () => {
  const b = {
    ...suggests,
    fullWord: "largely",
    answer: "largely",
    lemma: "large",
    root: "large",
    suffix: "ly",
    partOfSpeech: "adverb",
    wordFamily: "large largely largeness",
  };
  assert.equal(classifyAnswer(b, "larging"), "Word form");
  assert.equal(classifyAnswer(b, "large"), "Word form");
});
it("inflection precedes spelling, and real words never enter spelling", () => {
  assert.equal(classifyAnswer(suggests, "suggesting"), "Grammar ending");
  const b = {
    ...suggests,
    fullWord: "cat",
    answer: "cat",
    lemma: "cat",
    root: "cat",
    partOfSpeech: "noun",
    wordFamily: "cat",
    suffix: "",
  };
  assert.equal(classifyAnswer(b, "cats"), "Grammar ending");
  assert.equal(classifyAnswer(b, "car"), "Context / meaning");
  assert.equal(classifyAnswer(b, "cqt"), "Spelling");
  assert.equal(editDistance("resilience", "resilence"), 1);
});
it("resilence is spelling; resistance is meaning; resilient is form", () => {
  const b = seedPracticeSets[0].blanks[3];
  assert.equal(classifyAnswer(b, "lence"), "Spelling");
  assert.equal(classifyAnswer(b, "stance"), "Context / meaning");
  assert.equal(classifyAnswer(b, "lient"), "Word form");
});
it("case-normalized offline dictionary recognizes words, not test nonwords", () => {
  for (const word of ["resistance", "supports", "suggestion", "a", "I"])
    assert.equal(isEnglishWord(word), true);
  for (const word of ["sugrom", "sugests", "resilence", "larging"])
    assert.equal(isEnglishWord(word), false);
});

// Full candidate words for the 24 unchanged seeded blanks. Every candidate keeps
// the fixed prefix; the classifier receives only the missing letters.
const examples: Array<[string, MissCategory]> = [
  ["independant", "Spelling"],
  ["exchanges", "Grammar ending"],
  ["supports", "Grammar ending"],
  ["resilence", "Spelling"],
  ["recovery", "Word form"],
  ["studyies", "Word retrieval"],
  ["growths", "Grammar ending"],
  ["survive", "Word form"],
  ["recort", "Spelling"],
  ["recaal", "Spelling"],
  ["genetic", "Context / meaning"],
  ["flexibly", "Word form"],
  ["vulnerabl", "Spelling"],
  ["support", "Grammar ending"],
  ["consolidate", "Word form"],
  ["disrupts", "Grammar ending"],
  ["evident", "Word form"],
  ["organize", "Grammar ending"],
  ["hierarchy", "Grammar ending"],
  ["relation", "Context / meaning"],
  ["careless", "Context / meaning"],
  ["increasing", "Word form"],
  ["excavated", "Grammar ending"],
  ["interpret", "Word form"],
];
seedPracticeSets
  .flatMap((s) => s.blanks)
  .forEach((b, i) => {
    const [candidate, category] = examples[i];
    it(`${b.id}: ${candidate} for ${b.fullWord} → ${category}`, () => {
      assert.ok(candidate.startsWith(b.prefix));
      assert.equal(
        classifyAnswer(b, candidate.slice(b.prefix.length)),
        category,
      );
      assert.equal(classifyAnswer(b, b.answer), null);
      assert.equal(classifyAnswer(b, ""), "Word retrieval");
      for (const field of [
        "lemma",
        "partOfSpeech",
        "wordFamily",
        "root",
        "linguisticPrefix",
        "suffix",
      ] as const)
        assert.equal(typeof b[field], "string");
    });
  });
it("seed repair upgrades exact legacy morphology and preserves edited metadata/answers", () => {
  for (const b of seedPracticeSets.flatMap((s) => s.blanks)) {
    const old = { ...b, ...legacy[b.id as keyof typeof legacy] };
    assert.equal(seedMorphologyUpgrade(old, b)?.lemma, b.lemma);
    assert.equal(
      seedMorphologyUpgrade({ ...old, root: "edited-by-admin" }, b),
      null,
    );
    assert.equal(
      seedMorphologyUpgrade({ ...old, fullWord: "edited" }, b),
      null,
    );
  }
});
it("server diagnosis and drill selection follow actual spelling slips on word-form blanks", () => {
  const blanks = [seedPracticeSets[0].blanks[3], seedPracticeSets[1].blanks[3]];
  const suffixes = ["lence", "ble"];
  const scored = scorePracticeAnswers(
    blanks,
    blanks.map((b, i) => ({ blankId: b.id, value: suffixes[i] })),
  );
  assert.deepEqual(
    scored.map((i) => i.missCategory),
    ["Spelling", "Spelling"],
  );
  assert.deepEqual(
    scored.map((i) => i.errorCategory),
    ["word formation", "adjective ending"],
  );
  const diagnosed = diagnoseAttempts(
    blanks.map((blank, i) => ({
      blank,
      submitted: suffixes[i],
      isCorrect: false,
    })),
  );
  assert.equal(diagnosed.length, 1);
  assert.equal(diagnosed[0].key, "spelling");
  assert.equal(diagnosed[0].count, 2);
});

it("regularized inflections retain their lemma before spelling; short real alternatives stay context", () => {
  assert.equal(
    classifyAnswer(seedPracticeSets[0].blanks[5], "ed"),
    "Grammar ending",
  );
  assert.equal(
    classifyAnswer(seedPracticeSets[1].blanks[1], "l"),
    "Context / meaning",
  ); // recal is listed
});

it("handles the specified -es, -ing, -er and -est inflections", () => {
  const watch = {
    ...suggests,
    fullWord: "watches",
    answer: "watches",
    lemma: "watch",
    root: "watch",
    wordFamily: "watch",
    suffix: "es",
  };
  assert.equal(classifyAnswer(watch, "watch"), "Grammar ending");
  assert.equal(classifyAnswer(watch, "watching"), "Grammar ending");
  const large = {
    ...suggests,
    fullWord: "large",
    answer: "large",
    lemma: "large",
    root: "large",
    wordFamily: "large largely",
    partOfSpeech: "adjective",
    suffix: "",
  };
  assert.equal(classifyAnswer(large, "larger"), "Grammar ending");
  assert.equal(classifyAnswer(large, "largest"), "Grammar ending");
});


it("short guesses compare only typed letters with missing letters", () => {
  assert.equal(classifyAnswer(seedPracticeSets[1].blanks[1], "pe"), "Word retrieval");
  assert.equal(classifyAnswer(seedPracticeSets[0].blanks[3], " LENCE "), "Spelling");
});

it("spelling allows one edit for four missing letters and two for five", () => {
  const four = { ...suggests, prefix: "sugg", answer: "ests", missingLength: 4 };
  assert.equal(classifyAnswer(four, "eqts"), "Spelling");
  assert.equal(classifyAnswer(four, "eqqs"), "Word retrieval");
  const five = { ...suggests, prefix: "sug", answer: "gests", missingLength: 5 };
  assert.equal(classifyAnswer(five, "geqqs"), "Spelling");
  assert.equal(classifyAnswer(five, "gqqqs"), "Word retrieval");
});
