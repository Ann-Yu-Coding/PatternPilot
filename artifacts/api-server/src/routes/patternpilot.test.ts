import assert from "node:assert/strict";
import { after, before, describe, it, mock } from "node:test";
import type { Server } from "node:http";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { sessions } from "../data/patternpilot";
import { seedPracticeSets as practiceSets } from "../data/practice-question-seed";
import { learningContentByWeakness } from "../services/diagnosis";
import type { QuestionImportResult, PracticeSession, PracticeSet, TrainingSet, PracticeResult, TrainingResult } from "@workspace/api-zod";

const adminSecret = "test-only-admin-secret";
let server: Server;
let base: string;
before(async () => {
  process.env.LOG_LEVEL = "silent";
  process.env.ADMIN_SECRET = adminSecret;
  if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL must point to a dedicated migrated test database");
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { pool } = await import("@workspace/db");
  const query = pool.query.bind(pool);
  mock.method(pool, "query", (...args: any[]) => {
    const statement = typeof args[0] === "string" ? args[0] : args[0]?.text ?? "";
    if (/weakness_categories|targeted_drills/.test(statement)) throw new Error("Learning fallback in test");
    return (query as any)(...args);
  });
  const { seedQuestions } = await import("../services/question-repository");
  await seedQuestions(practiceSets);
  const { default: app } = await import("../app");
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  base = `http://127.0.0.1:${address.port}/api`;
});
after(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  mock.restoreAll();
  const { pool } = await import("@workspace/db");
  await pool.end();
});
async function request(path: string, body?: unknown) {
  const response = await rawRequest(path, body);
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

async function removeQuestions(ids: string[]) {
  const { pool } = await import("@workspace/db");
  await pool.query("DELETE FROM question_blanks WHERE question_id IN (SELECT id FROM questions WHERE public_id = ANY($1))", [ids]);
  await pool.query("DELETE FROM questions WHERE public_id = ANY($1)", [ids]);
}
async function rawRequest(path: string, body?: unknown) {
  return fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(path.startsWith("/admin/") ? { Authorization: `Bearer ${adminSecret}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("Postgres question durability", () => {
  it("preserves seed payloads/order and is insert-only on repeated seeding", async () => {
    const { readQuestions, seedQuestions } = await import("../services/question-repository");
    assert.deepEqual(await readQuestions({ ids: practiceSets.map(s => s.id) }), practiceSets);
    assert.deepEqual(await seedQuestions(practiceSets), { inserted: 0, existing: 3 });
    const { pool } = await import("@workspace/db");
    try {
      await pool.query("UPDATE questions SET title = 'Edited title' WHERE public_id = 'set-ecology'");
      await seedQuestions(practiceSets);
      assert.equal((await readQuestions({ ids: ["set-ecology"] }))[0].title, "Edited title");
    } finally { await pool.query("UPDATE questions SET title = $1 WHERE public_id = 'set-ecology'", [practiceSets[0].title]); }
  });
  it("creates full questions durably and grades newly stored answers", async () => {
    const source = practiceSets[0];
    const created = await request("/admin/questions", { ...source, title: "DB-only question" }) as PracticeSet;
    let session: PracticeSession | undefined;
    try {
      assert.notEqual(created.id, source.id);
      assert.ok(created.passage.includes(`{{${created.id}__b1}}`));
      const publicSets = await request("/practice/sets") as PracticeSet[];
      assert.ok(publicSets.some(s => s.id === created.id));
      assertNoAnswerFields(publicSets);
      // Independent Node process proves content is not coming from the route's memory.
      const result = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e",
        'const { readQuestions } = await import("./src/services/question-repository.ts"); const { pool } = await import("@workspace/db"); console.log(JSON.stringify(await readQuestions({ids:[process.env.CHECK_QUESTION_ID]}))); await pool.end();'],
        { cwd: process.cwd(), env: { ...process.env, CHECK_QUESTION_ID: created.id }, encoding: "utf8" });
      assert.equal(JSON.parse(result)[0].title, "DB-only question");
      session = await request("/practice/sessions", { setIds: [created.id] }) as PracticeSession;
      const scored = await request(`/practice/sessions/${session.id}/submit`, { answers: source.blanks.map((b, i) => ({ blankId: created.blanks[i].id, value: b.answer })) }) as PracticeResult;
      assert.equal(scored.score, 8);
    } finally { if (session) sessions.delete(session.id); await removeQuestions([created.id]); }
  });
  it("persists draft creation and filters published=false literally", async () => {
    const title = `Draft ${randomUUID()} %_`;
    const created = await request("/admin/questions", { title, topic: "Test", difficulty: "Core", passage: "Draft", blanks: [] }) as PracticeSet;
    try {
      const drafts = await request(`/admin/questions?published=false&search=${encodeURIComponent(title)}`) as PracticeSet[];
      assert.deepEqual(drafts.map(s => s.id), [created.id]);
      assert.ok(!(await request("/practice/sets") as PracticeSet[]).some(s => s.id === created.id));
      assert.equal((await rawRequest("/practice/sessions", { setIds: [created.id] })).status, 400);
    } finally { await removeQuestions([created.id]); }
  });
  it("imports qualified IDs, skips invalid rows, and keeps imports unpublished", async () => {
    const title = `Import ${randomUUID()}`;
    const result = await request("/admin/questions/import", { format: "json", raw: JSON.stringify([{ ...practiceSets[0], title }, { title: "bad", passage: "{{missing}}", blanks: [] }]) }) as QuestionImportResult;
    const imported = await request(`/admin/questions?search=${encodeURIComponent(title)}`) as PracticeSet[];
    try {
      assert.equal(result.imported, 1); assert.equal(result.skipped, 1);
      assert.equal(imported.length, 1); assert.equal((imported[0] as any).published, false);
      assert.ok(imported[0].passage.includes(`{{${imported[0].id}__b1}}`));
      assert.ok(!imported[0].passage.includes("set-ecology__"));
    } finally { await removeQuestions(imported.map(s => s.id)); }
  });
  it("imports quoted CSV passages without splitting their commas", async () => {
    const title = `CSV ${randomUUID()}`;
    const result = await request("/admin/questions/import", { format: "csv", raw: `title,topic,difficulty,passage\n${title},Test,Core,"Hello, world"` }) as QuestionImportResult;
    const imported = await request(`/admin/questions?search=${encodeURIComponent(title)}`) as PracticeSet[];
    try { assert.equal(result.imported, 1); assert.equal(imported[0].passage, "Hello, world"); }
    finally { await removeQuestions(imported.map(s => s.id)); }
  });
  it("rejects invalid create/import/session input without reporting success", async () => {
    for (const input of [{ ...practiceSets[0], blanks: [practiceSets[0].blanks[0]] }, { ...practiceSets[0], blanks: practiceSets[0].blanks.map(b => ({ ...b, missingLength: 99 })) }]) {
      assert.equal((await rawRequest("/admin/questions", input)).status, 400);
    }
    assert.equal((await rawRequest("/admin/questions/import", { format: "json", raw: "{}" })).status, 400);
    assert.equal((await rawRequest("/practice/sessions", { setIds: ["set-ecology", "set-ecology"] })).status, 400);
    assert.equal((await rawRequest("/practice/sessions", { setIds: ["missing"] })).status, 400);
  });
  it("rolls back a whole batch when a database constraint fails", async () => {
    const { prepareQuestion } = await import("../services/question-validation");
    const { createQuestions, readQuestions } = await import("../services/question-repository");
    const good = prepareQuestion(practiceSets[0]);
    const bad = prepareQuestion(practiceSets[1]);
    bad.blanks[0].order = bad.blanks[1].order;
    await assert.rejects(createQuestions([good, bad]));
    assert.deepEqual(await readQuestions({ ids: [good.id, bad.id] }), []);
  });
  it("rejects incomplete seed records without partially inserting the batch", async () => {
    const { prepareQuestion } = await import("../services/question-validation");
    const { createQuestions, seedQuestions, readQuestions } = await import("../services/question-repository");
    const partial = prepareQuestion({ title: "Partial", topic: "Test", difficulty: "Core", passage: "", blanks: [] });
    const first = prepareQuestion(practiceSets[0]);
    await createQuestions([partial]);
    try {
      await assert.rejects(seedQuestions([first, { ...partial, blanks: practiceSets[0].blanks }]));
      assert.deepEqual(await readQuestions({ ids: [first.id] }), []);
    } finally { await removeQuestions([partial.id]); }
  });
  it("returns 409 instead of silently shortening grading when a question disappears", async () => {
    const id = randomUUID(); sessions.set(id, { id, setIds: ["missing"], startedAt: new Date().toISOString() });
    try { assert.equal((await rawRequest(`/practice/sessions/${id}/submit`, { answers: [] })).status, 409); }
    finally { sessions.delete(id); }
  });
  it("returns sanitized 503s on DB failure instead of in-memory data or import success", async () => {
    const { pool } = await import("@workspace/db");
    const failure = mock.method(pool, "connect", async () => { throw new Error("secret database details"); });
    try {
      for (const [path, body] of [["/practice/sets", undefined], ["/admin/questions", undefined], ["/admin/questions/import", { format: "json", raw: JSON.stringify([practiceSets[0]]) }]] as const) {
        const response = await rawRequest(path, body);
        assert.equal(response.status, 503);
        assert.deepEqual(await response.json(), { error: "Question database unavailable" });
      }
    } finally { failure.mock.restore(); }
  });
});


describe("admin authentication", () => {
  it("rejects missing and incorrect credentials on every admin route before reading data or input", async () => {
    for (const [method, path] of [["GET", "/admin/questions"], ["POST", "/admin/questions"], ["POST", "/admin/questions/import"], ["DELETE", "/admin/future-route"]]) {
      for (const token of [undefined, "wrong-secret"]) {
        const response = await fetch(base + path, { method, headers: token ? { Authorization: `Bearer ${token}` } : {} });
        assert.equal(response.status, 401);
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.deepEqual(await response.json(), { error: "Admin authentication required" });
      }
    }
  });
  it("fails closed when the server secret is missing", async () => {
    delete process.env.ADMIN_SECRET;
    try { assert.equal((await rawRequest("/admin/questions")).status, 401); }
    finally { process.env.ADMIN_SECRET = adminSecret; }
  });
  it("allows authenticated reads while public responses still hide answers", async () => {
    const admin = await request("/admin/questions") as typeof practiceSets;
    assert.ok(admin.some(set => set.blanks.some(blank => blank.fullWord)));
    assertNoAnswerFields(await request("/practice/sets"));
  });
});


it("selects and grades the requested historical pattern without exposing drill answers", async () => {
  const id = `history-${randomUUID()}`;
  sessions.set(id, { id, setIds: [], startedAt: new Date().toISOString(), weaknessKey: "noun-formation" });
  try {
    const content=learningContentByWeakness["verb-inflection"];
    const training=await request(`/practice/sessions/${id}/training?categoryKey=verb-inflection`) as TrainingSet;
    assert.equal(training.categoryKey,"verb-inflection"); assertNoAnswerFields(training);
    const result=await request(`/practice/sessions/${id}/training?categoryKey=verb-inflection`, { answers:content.prompts.map(p=>({blankId:p.id,value:p.answer})) }) as TrainingResult;
    assert.equal(result.score,result.total);
    assert.equal((await rawRequest(`/practice/sessions/${id}/training?categoryKey=invalid`)).status,400);
  } finally { sessions.delete(id); }
});
