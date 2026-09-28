import assert from "node:assert/strict";
import { it } from "node:test";
import {
  emptyHistory,
  recordAttempt,
  findPattern,
  clearCategory,
  latestPassages,
  type Attempt,
} from "./practice-history";
function attempt(
  id: string,
  passageId: string,
  timestamp: number,
  categories: string[],
): Attempt {
  return {
    id,
    passageId,
    title: passageId,
    timestamp,
    score: 8 - categories.length,
    total: 8,
    elapsed: 20,
    misses: categories.map((errorCategory, i) => ({
      blankId: `${passageId}-${i}`,
      passageId,
      errorCategory,
      timestamp,
    })),
  };
}
it("finds a repeated category within one passage", () => {
  const h = recordAttempt(
    emptyHistory(),
    attempt("1", "a", 10, ["Word form", "Word form"]),
  );
  assert.deepEqual(findPattern(h), {
    category: "Word form",
    count: 2,
    totalMisses: 2,
    passages: 1,
    possible: false,
    evidence: "2 of your last 2 mistakes · across 1 passage",
  });
});
it("finds a pattern across passages", () => {
  const h = recordAttempt(
    recordAttempt(emptyHistory(), attempt("1", "a", 10, ["Spelling"])),
    attempt("2", "b", 20, ["Spelling"]),
  );
  assert.equal(findPattern(h)?.count, 2);
  assert.equal(findPattern(h)?.passages, 2);
});
it("single miss is a possible pattern", () => {
  assert.equal(
    findPattern(
      recordAttempt(emptyHistory(), attempt("1", "a", 10, ["Word form"])),
    )?.possible,
    true,
  );
});
it("breaks pattern ties by recency, then possible ties by latest occurrence", () => {
  let h = recordAttempt(
    emptyHistory(),
    attempt("1", "a", 10, ["Spelling", "Spelling"]),
  );
  h = recordAttempt(h, attempt("2", "b", 20, ["Word form", "Word form"]));
  assert.equal(findPattern(h)?.category, "Word form");
  h = recordAttempt(emptyHistory(), attempt("1", "a", 10, ["Spelling"]));
  h = recordAttempt(h, attempt("2", "b", 20, ["Word form"]));
  assert.equal(findPattern(h)?.category, "Word form");
});
it("a retry replaces evidence but preserves progress", () => {
  let h = recordAttempt(
    emptyHistory(),
    attempt("1", "a", 10, ["Word form", "Word form"]),
  );
  h = recordAttempt(h, attempt("2", "a", 20, ["Spelling"]));
  assert.equal(findPattern(h)?.category, "Spelling");
  assert.equal(findPattern(h)?.count, 1);
  assert.equal(h.attempts.length, 2);
  assert.equal(latestPassages(h).length, 1);
});
it("perfect drill clears earlier category evidence but preserves scores and future misses", () => {
  let h = recordAttempt(emptyHistory(), attempt("1", "a", 10, ["Word form"]));
  h = clearCategory(h, "Word form", 15);
  assert.equal(findPattern(h), null);
  assert.equal(h.attempts[0].score, 7);
  h = recordAttempt(h, attempt("2", "b", 20, ["Word form"]));
  assert.equal(findPattern(h)?.count, 1);
});
it("an all-correct current passage suppresses historical patterns", () => {
  let h = recordAttempt(
    emptyHistory(),
    attempt("1", "a", 10, ["Spelling", "Spelling"]),
  );
  h = recordAttempt(h, attempt("2", "b", 20, []));
  assert.equal(findPattern(h), null);
});
it("only the last five distinct passages contribute and repeated recording is idempotent", () => {
  let h = emptyHistory();
  for (let i = 1; i <= 6; i++)
    h = recordAttempt(
      h,
      attempt(String(i), String(i), i, [i === 1 ? "Old" : "Word form"]),
    );
  assert.equal(findPattern(h)?.count, 5);
  h = recordAttempt(h, attempt("6", "6", 6, ["Word form"]));
  assert.equal(h.attempts.length, 6);
});
