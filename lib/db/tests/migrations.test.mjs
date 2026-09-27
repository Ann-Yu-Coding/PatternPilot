import assert from "node:assert/strict";
import { it } from "node:test";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { adoptBaseline } from "../scripts/baseline.mjs";
const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
const migrations = readMigrationFiles({ migrationsFolder });
async function withDatabase(run) {
  if (!process.env.TEST_DATABASE_URL)
    throw new Error(
      "TEST_DATABASE_URL is required; role needs CREATEDB for isolated migration tests",
    );
  const url = new URL(process.env.TEST_DATABASE_URL);
  const admin = new pg.Pool({ connectionString: url.toString() });
  const name = `pp_migration_${randomUUID().replaceAll("-", "")}`;
  let pool;
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
    url.pathname = `/${name}`;
    pool = new pg.Pool({ connectionString: url.toString() });
    await run(pool);
  } finally {
    if (pool) {
      await pool.end();
      await admin.query(`DROP DATABASE "${name}"`);
    }
    await admin.end();
  }
}
async function baseline(pool) {
  for (const statement of migrations[0].sql) await pool.query(statement);
}
it("fresh migration is repeatable and enforces blank consistency", () =>
  withDatabase(async (pool) => {
    await migrate(drizzle(pool), { migrationsFolder });
    await migrate(drizzle(pool), { migrationsFolder });
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations",
        )
      ).rows[0].n,
      2,
    );
    const {
      rows: [q],
    } = await pool.query(
      "INSERT INTO questions(public_id, title, passage, topic, difficulty, display_order) VALUES ('q','t','p','t','Core',1) RETURNING id",
    );
    await assert.rejects(
      pool.query(
        "INSERT INTO question_blanks(public_id, question_id, position, prefix, missing_length, correct_answer, full_word) VALUES ('b',$1,1,'a',2,'b','ab')",
        [q.id],
      ),
      /question_blanks_answer_length/,
    );
    await assert.rejects(
      pool.query(
        "INSERT INTO questions(public_id,title,passage,topic,difficulty,display_order) VALUES ('q','t','p','t','Core',1)",
      ),
      /questions_public_id_unique/,
    );
  }));
it("adopts a matching legacy schema and preserves UUIDs, references and tokens", () =>
  withDatabase(async (pool) => {
    await baseline(pool);
    assert.deepEqual(await adoptBaseline(pool), {
      verified: true,
      applied: false,
    });
    assert.equal(
      (
        await pool.query(
          "SELECT to_regclass('drizzle.__drizzle_migrations') AS name",
        )
      ).rows[0].name,
      null,
    );
    const q = randomUUID(),
      b = randomUUID();
    await pool.query(
      "INSERT INTO questions(id,title,passage,topic,difficulty) VALUES ($1,'legacy',$2,'Test','Core')",
      [q, `a{{${b}}}`],
    );
    await pool.query(
      "INSERT INTO question_blanks(id,question_id,position,prefix,missing_length,correct_answer,full_word) VALUES ($1,$2,1,'a',1,'b','ab')",
      [b, q],
    );
    await adoptBaseline(pool, true);
    await migrate(drizzle(pool), { migrationsFolder });
    const stored = (
      await pool.query(
        "SELECT q.id, q.public_id, q.passage, b.public_id AS blank_id FROM questions q JOIN question_blanks b ON b.question_id=q.id",
      )
    ).rows[0];
    assert.deepEqual(stored, {
      id: q,
      public_id: q,
      passage: `a{{${b}}}`,
      blank_id: b,
    });
  }));
it("refuses baseline adoption when schema drift exists", () =>
  withDatabase(async (pool) => {
    await baseline(pool);
    await pool.query("ALTER TABLE questions ADD COLUMN unexpected text");
    await assert.rejects(adoptBaseline(pool, true), /differs/);
    assert.equal(
      (
        await pool.query(
          "SELECT to_regclass('drizzle.__drizzle_migrations') AS name",
        )
      ).rows[0].name,
      null,
    );
  }));
it("rolls back upgrade on unresolvable legacy tokens without deleting data", () =>
  withDatabase(async (pool) => {
    await baseline(pool);
    await adoptBaseline(pool, true);
    const q = randomUUID();
    await pool.query(
      "INSERT INTO questions(id,title,passage,topic,difficulty) VALUES ($1,'legacy','{{b1}}','Test','Core')",
      [q],
    );
    await pool.query(
      "INSERT INTO question_blanks(question_id,position,prefix,missing_length,correct_answer,full_word) VALUES ($1,1,'a',1,'b','ab')",
      [q],
    );
    await assert.rejects(
      migrate(drizzle(pool), { migrationsFolder }),
      /Failed query/,
    );
    assert.equal(
      (await pool.query("SELECT passage FROM questions WHERE id=$1", [q]))
        .rows[0].passage,
      "{{b1}}",
    );
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name='questions' AND column_name='public_id'",
        )
      ).rows[0].n,
      0,
    );
  }));
