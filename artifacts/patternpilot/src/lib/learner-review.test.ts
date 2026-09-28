import assert from "node:assert/strict";
import { test } from "node:test";
import { wordChange, timeLabel } from "./learner-review";

test("wrong ending retains shared stem and exposes replacement", () => {
  assert.deepEqual(wordChange("resilient", "resilience"), {
    before: "resilien",
    wrong: "t",
    right: "ce",
    after: "",
  });
  assert.deepEqual(wordChange("survive", "survival"), {
    before: "surviv",
    wrong: "e",
    right: "al",
    after: "",
  });
});
test("missing and extra letters retain the matching suffix", () => {
  assert.deepEqual(wordChange("enviroment", "environment"), {
    before: "enviro",
    wrong: "",
    right: "n",
    after: "ment",
  });
  assert.deepEqual(wordChange("growtth", "growth"), {
    before: "growt",
    wrong: "t",
    right: "",
    after: "h",
  });
});
test("empty or unrelated answers never remove the correction", () => {
  assert.equal(wordChange("", "growth").right, "growth");
  assert.equal(wordChange("xyz", "growth").right, "growth");
});
test("elapsed time is not clamped to the countdown", () => {
  assert.equal(timeLabel(180), "3:00");
  assert.equal(timeLabel(321), "5:21");
  assert.equal(timeLabel(-1), "0:00");
});
