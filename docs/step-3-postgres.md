# Step 3: Postgres question storage

Questions and blanks now use Postgres through the existing Drizzle/node-postgres stack. API question IDs are stable text `public_id` values; database UUID primary keys remain internal. Public blank responses still contain only id, order, prefix, and missingLength. Correct answers and diagnostic metadata are retrieved only for admin operations and server-side grading.

## Local setup

Use PostgreSQL 17 (the Compose file supplies a persistent development volume):

```sh
docker compose -f compose.postgres.yaml up -d
export DATABASE_URL='postgres://patternpilot:local-development-only@127.0.0.1:5432/patternpilot'
pnpm --filter @workspace/db migrate
pnpm --filter @workspace/api-server seed:questions
PORT=5000 pnpm --filter @workspace/api-server dev
```

In another terminal:

```sh
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/patternpilot dev
```

Vite proxies `/api` to `http://127.0.0.1:5000`, overridable with `API_PROXY_TARGET`. No frontend redesign is required. A native Postgres installation also works. `.env.example` documents the settings; shell export or the deployment environment must load them explicitly. The application does not automatically load `.env`.

## Migrations

- `lib/db/drizzle/0000_baseline.sql`: the pre-Step-3 schema, including existing unrelated tables unchanged.
- `lib/db/drizzle/0001_question_storage.sql`: additive public IDs, display order, estimated minutes, backfills, indexes, and blank constraints.
- `lib/db/drizzle/meta/`: Drizzle snapshots and journal, committed with SQL.

For a fresh database, run `pnpm --filter @workspace/db migrate`. Repeating it is safe. Future changes use `pnpm --filter @workspace/db generate --name descriptive_name`, review the SQL, then migrate. Do not use `push-force` or schema push in production.

For an existing database previously managed by schema push:

1. Back up the database and inspect existing question content. Export any additions still in the running old in-memory server before restarting it. The seed only preserves the three checked-in passages; normal admin import creates new IDs and is not an identity-preserving legacy export loader.
2. Run `pnpm --filter @workspace/db baseline` to verify that existing table columns, constraints, and indexes match the old baseline. The dry run rolls back all temporary objects.
3. If verified, run `pnpm --filter @workspace/db baseline --apply`. This records only the already-applied baseline in Drizzle's journal; it does not recreate the tables or replace rows.
4. Run `pnpm --filter @workspace/db migrate` and then the explicit question seed.

Baseline adoption refuses schema drift or existing migration history. Resolve differences explicitly; never mark an unverified schema as migrated. The verifier needs permission to create a temporary reference schema. Test this sequence on a restored copy first.

Existing DB UUID question and blank IDs are retained as their public IDs. Legacy passage tokens must reference those blank UUIDs exactly once. Unknown, repeated, or local tokens cause migration rollback; reconcile them with their correct blank rows before retrying. Positions must already be positive and unique per question; answers, lengths, full words, and tags must satisfy the new constraints. Existing question ordering is backfilled deterministically from creation time and UUID. No legacy row is deleted. The checked-in seed has its own unchanged IDs and order.

## Explicit seed behavior

```sh
pnpm --filter @workspace/api-server seed:questions
```

On an empty question bank, inserts three published passages and 24 blanks, keeping `set-ecology`, `set-memory`, `set-archaeology`, and every qualified blank ID. Estimated minutes remain 7, 7, and 8. Seeds append after existing records; a fresh bank retains the original UI order.

The seed validates source content and commits as one transaction. Repeated runs report `{ inserted: 0, existing: 3 }`; existing titles, answers, and metadata are not overwritten. An existing seed question with missing/extra blank identities is a conflict and rolls back the batch. An advisory transaction lock and unique constraints serialize seed/admin insertion. There is no request-time question seed and no question fallback to memory.

Admin import is intentionally a copy operation: repeat imports create new unpublished records with new IDs. It is not the idempotent seed. Exported qualified passage tokens and local tokens are both remapped to the new question ID. Invalid rows are counted as skipped; all valid rows commit together, and a database failure rolls the valid batch back and returns 503. Malformed JSON/CSV or invalid request envelopes return 400. CSV retains the existing title/topic/difficulty/passage columns and supports quoted commas, newlines, and escaped quotes. CSV entries remain empty-blank drafts.

## Runtime behavior

- Public GET lists published questions in stored order using display-only blank projections and the existing Zod response contract.
- Admin list reads Postgres, with literal case-insensitive search and true/false publication filtering.
- Admin create validates and stores a question plus its blanks atomically; empty drafts remain supported.
- Session creation checks the requested published IDs and rejects duplicates or missing questions.
- Submission retrieves complete blanks from Postgres for the session's set IDs, orders them as before, and calls the unchanged scoring and diagnosis functions. Missing session content returns 409 instead of silently shortening the score denominator.
- Database failures return sanitized 503 responses. Empty question banks return empty lists.
- Sessions and results remain transient. No attempts are written. No update/delete endpoint or publication versioning was added.

## Tests

Use only a dedicated disposable test database. HTTP tests seed the three passages and create/remove test records; never point them at production. Migration tests create and drop uniquely named disposable databases, so the test role needs CREATEDB.

```sh
# Create patternpilot_test using your local Postgres administrator.
export TEST_DATABASE_URL='postgres://patternpilot:local-development-only@127.0.0.1:5432/patternpilot_test'
DATABASE_URL="$TEST_DATABASE_URL" pnpm --filter @workspace/db migrate
pnpm --filter @workspace/db test:migrations
pnpm run typecheck:libs
pnpm --filter @workspace/api-server test
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server build
pnpm --filter @workspace/patternpilot typecheck
```

The API suite uses real Postgres for question storage and mocks only the pre-existing learning-content fallback tests. A separate Node process verifies that an admin-created question is durable. Migration tests cover fresh/repeated migration, exact baseline adoption, schema drift, UUID/token preservation, and rollback for incompatible legacy tokens. API tests cover seed idempotency/no-overwrite, secrecy, grading, admin durability, qualified imports, quoted CSV, rollback, invalid content and database errors.

Regenerate OpenAPI clients with `pnpm --filter @workspace/api-spec codegen` after contract changes. Successful existing payloads remain unchanged; the specification now documents error responses.

## Production and limitations

Supply DATABASE_URL as a server-side secret with the provider's required TLS settings. Use a persistent Postgres service with backups. Run migration once as a deployment job, then explicit seeding, before starting the new API. Pause admin writes during cutover and verify the question counts, IDs, and payloads. Do not roll back to an array-backed application after accepting durable writes: it would hide DB content. Keep the database and prefer a forward fix.

Use a single API instance for this MVP. Sessions disappear on restart and cannot move across replicas. The existing Replit autoscale configuration must be constrained appropriately by the deployment operator; this step does not implement session sharing.

Admin endpoints still have their existing lack of authentication and expose full question records. Authentication is not part of Step 3. Arbitrary authored prose is not semantically redacted. There is no content-versioning protection against direct database edits while a learner is practicing. No update API, auth, payments, dashboard, session persistence, or diagnosis taxonomy work was added. Targeted learning content retains its prior DB/fallback behavior.

## Implementation verification

Verified locally against isolated PostgreSQL 17: 30 API tests and four migration tests passed. API typecheck, API build, frontend typecheck, shared-library typecheck, OpenAPI code generation, and `git diff --check` passed. The first explicit seed inserted three questions; the second inserted zero and preserved three. No production database was accessed or migrated. No browser interaction test was performed. PostgreSQL was installed locally for testing; the temporary test server was stopped afterward.

## Changed file inventory

- `.env.example`
- `.gitignore`
- `artifacts/api-server/package.json`
- `artifacts/api-server/src/app.ts`
- `artifacts/api-server/src/data/patternpilot.test.ts`
- `artifacts/api-server/src/data/patternpilot.ts`
- `artifacts/api-server/src/data/practice-question-seed.ts`
- `artifacts/api-server/src/routes/patternpilot.test.ts`
- `artifacts/api-server/src/routes/patternpilot.ts`
- `artifacts/api-server/src/scripts/seed-questions.ts`
- `artifacts/api-server/src/services/question-repository.ts`
- `artifacts/api-server/src/services/question-validation.ts`
- `artifacts/patternpilot/vite.config.ts`
- `compose.postgres.yaml`
- `docs/step-3-postgres.md`
- `lib/api-client-react/src/generated/api.schemas.ts`
- `lib/api-client-react/src/generated/api.ts`
- `lib/api-spec/openapi.yaml`
- `lib/api-zod/src/generated/types/errorResponse.ts`
- `lib/api-zod/src/generated/types/index.ts`
- `lib/db/drizzle/0000_baseline.sql`
- `lib/db/drizzle/0001_question_storage.sql`
- `lib/db/drizzle/meta/0000_snapshot.json`
- `lib/db/drizzle/meta/0001_snapshot.json`
- `lib/db/drizzle/meta/_journal.json`
- `lib/db/package.json`
- `lib/db/scripts/baseline.mjs`
- `lib/db/src/index.ts`
- `lib/db/src/schema/patternpilot.ts`
- `lib/db/tests/migrations.test.mjs`
- `replit.md`

Changes are uncommitted. Existing untracked screenshots are untouched.
