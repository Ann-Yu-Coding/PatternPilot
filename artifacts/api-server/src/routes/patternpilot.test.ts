import assert from "node:assert/strict";
import { after, before, describe, it, mock } from "node:test";
import type { Server } from "node:http";
import express from "express";
import { practiceSets, sessions } from "../data/patternpilot";
import { learningContentByWeakness } from "../services/diagnosis";
import type { PracticeSession, PracticeSet, TrainingSet, PracticeResult, TrainingResult } from "@workspace/api-zod";

let server: Server;
let base: string;
before(async () => {
  // Exercise HTTP serialization without requiring or modifying a real database.
  process.env.DATABASE_URL = "postgres://unused:unused@127.0.0.1:1/unused";
  const { pool } = await import("@workspace/db");
  mock.method(pool, "query", async () => { throw new Error("Database unavailable in test"); });
  const { default: router } = await import("./patternpilot");
  const app = express().use(express.json()).use("/api", router);
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  base = `http://127.0.0.1:${address.port}/api`;
});
after(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  mock.restoreAll();
});
async function request(path: string, body?: unknown) {
  const response = await fetch(base + path, body === undefined ? undefined : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  assert.ok(response.ok, `${path}: ${response.status}`);
  return response.json();
}
const forbidden = new Set(["answer", "fullWord", "lemma", "partOfSpeech", "wordFamily", "root", "suffix", "errorCategory", "tags", "hint", "explanation"]);
function assertNoAnswerFields(value: unknown) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!forbidden.has(key), `Public response leaked ${key}`);
    assertNoAnswerFields(child);
  }
}

describe("public practice HTTP contracts", () => {
  it("GET sets exposes only display blank fields, preserving tokens and server keys", async () => {
    const sets = await request("/practice/sets") as PracticeSet[];
    assert.equal(sets.length, practiceSets.filter((set) => set.published).length);
    assertNoAnswerFields(sets);
    for (const set of sets) {
      for (const blank of set.blanks) {
        assert.deepEqual(Object.keys(blank).sort(), ["id", "missingLength", "order", "prefix"]);
        assert.ok(set.passage.includes(`{{${blank.id}}}`));
      }
    }
    assert.ok(practiceSets[0].blanks[0].answer);
  });

  it("grades practice using server keys and reveals completed words only in results", async () => {
    const set = practiceSets.find((entry) => entry.published)!;
    const session = await request("/practice/sessions", { setIds: [set.id] }) as PracticeSession;
    assertNoAnswerFields(session);
    try {
      const result = await request(`/practice/sessions/${session.id}/submit`, {
        score: 999,
        answers: set.blanks.map((blank, index) => ({ blankId: blank.id, value: index === 0 ? ` ${blank.answer.toUpperCase()} ` : "WRONG", answer: "WRONG", isCorrect: true })),
      }) as PracticeResult;
      assert.equal(result.score, 1);
      assert.equal(result.total, set.blanks.length);
      assert.equal(result.items[0].fullWord, set.blanks[0].fullWord);
      assert.ok(result.items[1].explanation);
    } finally { sessions.delete(session.id); }
  });

  for (const content of Object.values(learningContentByWeakness)) {
    it(`GET ${content.categoryKey} training hides keys, hints, and completed spelling cues; POST grades on server`, async () => {
      const id = `test-${content.categoryKey}`;
      sessions.set(id, { id, setIds: [], startedAt: new Date().toISOString(), weaknessKey: content.categoryKey });
      try {
        const training = await request(`/practice/sessions/${id}/training`) as TrainingSet;
        assertNoAnswerFields(training);
        for (const [index, prompt] of training.prompts.entries()) {
          const source = content.prompts[index];
          assert.deepEqual(Object.keys(prompt).sort(), ["id", "missingLength", "prefix", "prompt"]);
          assert.equal(prompt.missingLength, source.answer.length);
          assert.ok(!prompt.prompt.toLowerCase().split(/[^a-z]+/).includes((source.prefix + source.answer).toLowerCase()));
        }
        const result = await request(`/practice/sessions/${id}/training`, {
          score: 999,
          answers: content.prompts.map((prompt, index) => ({ blankId: prompt.id, value: index === 0 ? ` ${prompt.answer.toUpperCase()} ` : "WRONG", answer: "WRONG", isCorrect: true })),
        }) as TrainingResult;
        assert.equal(result.score, 1);
        assert.equal(result.total, content.prompts.length);
        assert.equal(result.items[0].fullWord, content.prompts[0].prefix + content.prompts[0].answer);
        assert.equal(result.items[1].explanation, content.prompts[1].hint);
      } finally { sessions.delete(id); }
    });
  }
});
