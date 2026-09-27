import pg from "pg";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
/** Verify the old schema exactly before recording its already-applied baseline. */
export async function adoptBaseline(pool, apply = false) {
  const client = await pool.connect();
  const reference = `baseline_${randomUUID().replaceAll("-", "")}`;
  const migration = readMigrationFiles({ migrationsFolder })[0];
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(731903)");
    const { rows: history } = await client.query(
      "SELECT to_regclass('drizzle.__drizzle_migrations') AS name",
    );
    if (history[0].name)
      throw new Error("Migration history already exists; use migrate instead");
    await client.query(`CREATE SCHEMA "${reference}"`);
    await client.query(`SET LOCAL search_path TO "${reference}", public`);
    for (const statement of migration.sql)
      await client.query(statement.replaceAll('"public".', `"${reference}".`));
    const { rows: tables } = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename",
      [reference],
    );
    const names = tables.map((t) => t.tablename);
    const signature = async (schema) => {
      const columns = await client.query(
        `SELECT table_name, column_name, udt_name, is_nullable, column_default
        FROM information_schema.columns WHERE table_schema = $1 AND table_name = ANY($2)
        ORDER BY table_name, ordinal_position`,
        [schema, names],
      );
      const constraints = await client.query(
        `SELECT c.relname, con.conname, pg_get_constraintdef(con.oid) AS definition
        FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = $1 AND c.relname = ANY($2) ORDER BY c.relname, con.conname`,
        [schema, names],
      );
      const indexes = await client.query(
        `SELECT tablename, indexname, indexdef FROM pg_indexes
        WHERE schemaname = $1 AND tablename = ANY($2) ORDER BY tablename, indexname`,
        [schema, names],
      );
      // Force qualification consistently while inspecting both schemas.
      return JSON.stringify([
        columns.rows,
        constraints.rows,
        indexes.rows,
      ]).replaceAll(`${schema}.`, "");
    };
    await client.query("SET LOCAL search_path TO pg_catalog");
    if ((await signature("public")) !== (await signature(reference)))
      throw new Error(
        "Existing schema differs from 0000_baseline; reconcile it before adoption",
      );
    await client.query(`DROP SCHEMA "${reference}" CASCADE`);
    if (apply) {
      await client.query('CREATE SCHEMA IF NOT EXISTS "drizzle"');
      await client.query(
        'CREATE TABLE "drizzle"."__drizzle_migrations" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)',
      );
      await client.query(
        'INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
        [migration.hash, migration.folderMillis],
      );
      await client.query("COMMIT");
    } else await client.query("ROLLBACK");
    return { verified: true, applied: apply };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log(await adoptBaseline(pool, process.argv.includes("--apply")));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
