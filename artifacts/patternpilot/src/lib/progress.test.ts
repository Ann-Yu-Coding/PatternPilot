import assert from "node:assert/strict";
import { it } from "node:test";
import {
  emptyHistory,
  recordAttempt,
  finishDrill,
  type Attempt,
} from "./practice-history";
import { progressPatterns, progressSummary } from "./progress";
import { readHistory, HISTORY_KEY } from "./history-storage";
const attempt = (
  id: string,
  passageId: string,
  timestamp: number,
  categories: string[],
  total = 8,
): Attempt => ({
  id,
  passageId,
  title: passageId,
  timestamp,
  score: total - categories.length,
  total,
  elapsed: 20,
  misses: categories.map((errorCategory, i) => ({
    blankId: `b${i}`,
    passageId,
    timestamp,
    errorCategory,
  })),
});
it("summary counts unique passages, weights blanks, and counts all completed drills", () => {
  let h = recordAttempt(
    emptyHistory(),
    attempt("a1", "a", 1, ["Spelling", "Spelling"]),
  );
  h = recordAttempt(h, attempt("a2", "a", 2, []));
  h = recordAttempt(h, attempt("b1", "b", 3, ["Word form"], 2));
  h = finishDrill(h, "Spelling", 3, 5, 4);
  h = finishDrill(h, "Spelling", 5, 5, 5);
  assert.equal(progressSummary(h).accuracy, 90);
  assert.equal(progressSummary(h).passages.length, 2);
  assert.equal(progressSummary(h).drills, 2);
  assert.equal(progressSummary(emptyHistory()).accuracy, 0);
});
it("Progress shows all qualifying categories, status/count/recency ordered, even after a correct passage", () => {
  let h = recordAttempt(
    emptyHistory(),
    attempt("1", "a", 1, ["Spelling", "Spelling", "Grammar ending"]),
  );
  h = recordAttempt(h, attempt("2", "b", 2, ["Word form", "Word form"]));
  h = recordAttempt(h, attempt("3", "c", 3, []));
  assert.deepEqual(
    progressPatterns(h).map((p) => [p.category, p.status]),
    [
      ["Word form", "Pattern"],
      ["Spelling", "Pattern"],
      ["Grammar ending", "Possible pattern"],
    ],
  );
});
it("non-perfect drills log without clearing; perfect clears only its category, new misses reactivate", () => {
  let h = recordAttempt(
    emptyHistory(),
    attempt("1", "a", 1, ["Spelling", "Spelling", "Word form"]),
  );
  h = finishDrill(h, "Spelling", 4, 5, 2);
  assert.equal(progressPatterns(h)[0].status, "Pattern");
  h = finishDrill(h, "Spelling", 5, 5, 3);
  let spelling = progressPatterns(h).find((p) => p.category === "Spelling")!;
  assert.equal(spelling.status, "Cleared");
  assert.equal(spelling.count, 2);
  assert.equal(spelling.drills.length, 2);
  assert.equal(progressPatterns(h)[0].category, "Word form");
  h = recordAttempt(h, attempt("2", "b", 4, ["Spelling"]));
  spelling = progressPatterns(h).find((p) => p.category === "Spelling")!;
  assert.equal(spelling.status, "Possible pattern");
  assert.equal(spelling.count, 1);
});
it("cleared achievements survive the recent window, but retries replace active evidence", () => {
  let h = recordAttempt(emptyHistory(), attempt("1", "a", 1, ["Spelling"]));
  h = finishDrill(h, "Spelling", 5, 5, 2);
  for (let i = 3; i < 9; i++)
    h = recordAttempt(h, attempt(String(i), String(i), i, []));
  assert.equal(progressPatterns(h)[0].status, "Cleared");
  h = recordAttempt(h, attempt("9", "9", 9, ["Spelling"]));
  h = recordAttempt(h, attempt("10", "9", 10, []));
  assert.deepEqual(progressPatterns(h), []); // new miss ended the old cleared achievement
});
it("no cleared achievement for a perfect drill without evidence, and only five latest passages are active", () => {
  let h = finishDrill(emptyHistory(), "Spelling", 5, 5, 1);
  assert.deepEqual(progressPatterns(h), []);
  for (let i = 2; i < 8; i++)
    h = recordAttempt(
      h,
      attempt(String(i), String(i), i, [i === 2 ? "Spelling" : "Word form"]),
    );
  assert.deepEqual(
    progressPatterns(h).map((p) => [p.category, p.count]),
    [["Word form", 5]],
  );
});
it("older localStorage history loads with no drill log; malformed drill records are ignored", () => {
  const old = globalThis.localStorage;
  try {
    let value = JSON.stringify({
      attempts: [attempt("1", "a", 1, ["Spelling"])],
      cleared: {},
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: { getItem: (key: string) => (key === HISTORY_KEY ? value : null) },
    });
    assert.deepEqual(readHistory().drills, []);
    assert.equal(readHistory().attempts.length, 1);
    value = JSON.stringify({
      ...readHistory(),
      drills: [
        { category: "Spelling", score: 4, total: 5, timestamp: 2 },
        { category: "Spelling", score: 8, total: 0, timestamp: 3 },
      ],
    });
    assert.equal(readHistory().drills?.length, 1);
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: old,
    });
  }
});

it("another perfect drill with no remaining evidence preserves an earlier cleared achievement", () => {
  let h = recordAttempt(emptyHistory(), attempt("1", "a", 1, ["Spelling"]));
  h = finishDrill(h, "Spelling", 5, 5, 2);
  h = recordAttempt(h, attempt("2", "a", 3, []));
  h = finishDrill(h, "Spelling", 5, 5, 4);
  assert.equal(progressPatterns(h)[0].status, "Cleared");
  assert.equal(progressPatterns(h)[0].count, 1);
});
