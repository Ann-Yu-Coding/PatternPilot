# PatternPilot

PatternPilot is a practice tool for the **"Complete the Words"** task in the new TOEFL format. Learners fill in missing word endings in short academic passages. PatternPilot grades the answers on the server, sorts each mistake into an error pattern (Grammar ending, Word form, Spelling, Word retrieval, Context / meaning), and offers a short targeted drill for that pattern.

The current milestone (v0.2) is one complete learning loop over three original seeded passages:

> Complete the Words → Check answers → See mistakes → Understand the pattern → Targeted drill → Progress

Before changing anything, read [`docs/product.md`](docs/product.md). It is the source of truth for scope, the error-pattern rules and the UI direction. AI coding agents should also follow [`AGENTS.md`](AGENTS.md).

## Prerequisites

- **Node.js 24** (the version Replit uses)
- **pnpm 10.** npm and yarn are blocked by a `preinstall` check. If you don't have pnpm, run `corepack enable`.
- **PostgreSQL 17**, either through Docker (`compose.postgres.yaml`) or a native install such as Homebrew's `postgresql@17`
- **macOS only:** one extra install step, described in [Quick start](#quick-start) step 2

## Quick start

All commands run from the repository root. The app does **not** load `.env` files, so export variables in each terminal. [`.env.example`](.env.example) lists them all. The credentials below are local placeholders. Don't reuse them anywhere else.

### 1. Install dependencies

```bash
git clone <repo-url> PatternPilot && cd PatternPilot
pnpm install
```

### 2. macOS only: add the native build binaries

`pnpm-workspace.yaml` strips the macOS builds of rollup, lightningcss and Tailwind's oxide engine, because Replit runs only on linux-x64. Without them the API still runs, but the frontend dev server and build fail with `Cannot find module @rollup/rollup-darwin-arm64`. This script installs the versions that match the lockfile into the gitignored `node_modules` folder without changing any tracked files:

```bash
ARCH=$(node -p process.arch)   # arm64 or x64
ver() { node -p "require('./node_modules/.pnpm/node_modules/$1/package.json').version"; }
NATIVE_DIR=$(mktemp -d)
npm install --prefix "$NATIVE_DIR" --no-save --no-package-lock \
  "@rollup/rollup-darwin-$ARCH@$(ver rollup)" \
  "lightningcss-darwin-$ARCH@$(ver lightningcss)" \
  "@tailwindcss/oxide-darwin-$ARCH@$(ver @tailwindcss/oxide)"
mkdir -p node_modules/@rollup node_modules/@tailwindcss
cp -R "$NATIVE_DIR/node_modules/@rollup/rollup-darwin-$ARCH" node_modules/@rollup/
cp -R "$NATIVE_DIR/node_modules/lightningcss-darwin-$ARCH" node_modules/
cp -R "$NATIVE_DIR/node_modules/@tailwindcss/oxide-darwin-$ARCH" node_modules/@tailwindcss/
```

Run it again if a later `pnpm install` brings the error back. On Linux x64, skip this step.

### 3. Start Postgres

**With Docker:**

```bash
docker compose -f compose.postgres.yaml up -d
```

This starts Postgres 17 on `127.0.0.1:5432` with user `patternpilot`, password `local-development-only` and database `patternpilot`.

**With a native install:** create the same role and database yourself. The role needs `CREATEDB` if you want to run the migration tests later.

```bash
psql -d postgres -c "CREATE ROLE patternpilot LOGIN CREATEDB PASSWORD 'local-development-only';" -c "CREATE DATABASE patternpilot OWNER patternpilot;"
```

### 4. Run migrations and seed the three passages

```bash
export DATABASE_URL='postgres://patternpilot:local-development-only@127.0.0.1:5432/patternpilot'
pnpm --filter @workspace/db migrate
pnpm --filter @workspace/api-server seed:questions
```

The first seed prints `{ inserted: 3, existing: 0 }`. Both commands are safe to repeat: a second seed prints `{ inserted: 0, existing: 3 }` and doesn't overwrite anything.

### 5. Start the API (terminal 1)

```bash
export DATABASE_URL='postgres://patternpilot:local-development-only@127.0.0.1:5432/patternpilot'
export ADMIN_SECRET='replace-with-a-long-random-string'
PORT=5059 pnpm --filter @workspace/api-server dev
```

`dev` builds the API once and starts it. It does **not** watch for changes, so restart it after editing server code. `curl http://127.0.0.1:5059/api/healthz` should return `{"status":"ok"}`.

We use port 5059 because macOS's AirPlay Receiver usually holds port 5000, the default in `.env.example` and `replit.md`. Any free port works if the proxy target in step 6 matches.

### 6. Start the frontend (terminal 2)

```bash
PORT=5173 BASE_PATH=/ API_PROXY_TARGET=http://127.0.0.1:5059 pnpm --filter @workspace/patternpilot dev
```

`PORT` and `BASE_PATH` are required. Vite proxies `/api` to `API_PROXY_TARGET`, which defaults to `http://127.0.0.1:5000`. Frontend changes reload automatically.

### 7. Open the app

Open **http://localhost:5173/practice**. You should see "Complete each word with the missing letters." with Practice 01, *How forests communicate*.

Other pages:

| URL | What it is |
|---|---|
| `/` | Landing page |
| `/practice` | Practice passage, then results and pattern cards on the same page |
| `/dashboard` | Progress (the *Progress* tab) |
| `/admin/questions` | Question studio. Asks for `ADMIN_SECRET`. Learners don't see a link to it. |

Practice history and the free-passage count are stored in the browser's `localStorage`. To start fresh, use a new browser profile or clear this site's storage. Practice sessions live in the API's memory, so after restarting the API, complete a new passage before you open a drill.

## Build, typecheck and test

| Command | Needs a database? | What it does |
|---|---|---|
| `pnpm run typecheck` | No | Typechecks the shared libraries and every app |
| `PORT=5173 BASE_PATH=/ pnpm build` | No | Runs typecheck, then builds the API (`artifacts/api-server/dist`) and the frontend (`artifacts/patternpilot/dist/public`). The frontend build needs `PORT` and `BASE_PATH` set. |
| Frontend unit tests (see below) | No | Practice history, free limit, Progress and review helpers |
| API unit tests (see below) | No | Scoring and answer classification (diagnosis) |
| `pnpm --filter @workspace/api-server test` | **Yes, `TEST_DATABASE_URL`** | The full API suite: the unit tests above plus HTTP tests for secrecy, admin auth, the waitlist and seeding. It fails immediately if `TEST_DATABASE_URL` is unset. |
| `pnpm --filter @workspace/db test:migrations` | **Yes, `TEST_DATABASE_URL`** plus a role with `CREATEDB` | Migration, baseline and rollback tests |

Tests that don't need a database:

```bash
pnpm --filter @workspace/api-server exec tsx --test ../patternpilot/src/lib/practice-history.test.ts ../patternpilot/src/lib/learner-review.test.ts ../patternpilot/src/lib/free-practice.test.ts ../patternpilot/src/lib/progress.test.ts
```

```bash
pnpm --filter @workspace/api-server exec tsx --test src/services/classify-answer.test.ts src/services/practice-scoring.test.ts src/data/patternpilot.test.ts
```

### Tests that need a separate test database

The database tests insert and delete rows, and the migration tests create and drop whole databases. Point `TEST_DATABASE_URL` at a **dedicated, disposable** database, never at your development data or production. Set it up once:

```bash
psql "postgres://patternpilot:local-development-only@127.0.0.1:5432/patternpilot" -c "CREATE DATABASE patternpilot_test;"
```

Then migrate it and run the suites:

```bash
export TEST_DATABASE_URL='postgres://patternpilot:local-development-only@127.0.0.1:5432/patternpilot_test'
DATABASE_URL="$TEST_DATABASE_URL" pnpm --filter @workspace/db migrate
pnpm --filter @workspace/api-server test
pnpm --filter @workspace/db test:migrations
```

### Before opening a pull request

1. Run `PORT=5173 BASE_PATH=/ pnpm build`. It includes typecheck.
2. Run all of the tests above.
3. For UI or learner-flow changes, walk through the relevant manual checks in [`docs/learner-flow.md`](docs/learner-flow.md#manual-checks). They include exact answers that produce each pattern.
4. Never expose correct answers or diagnostic metadata through public `/api` responses. The API tests check this.
5. If your change makes a product decision, add it to the decision log in `docs/product.md` §10.

## Database changes

Change the schema through migrations, not `push`:

```bash
pnpm --filter @workspace/db generate --name describe_your_change
```

Review the generated SQL in `lib/db/drizzle/`, then run `pnpm --filter @workspace/db migrate`. After changing the API contract in `lib/api-spec/openapi.yaml`, regenerate the client and schemas with `pnpm --filter @workspace/api-spec codegen`. For baseline adoption and production steps, see [`docs/step-3-postgres.md`](docs/step-3-postgres.md).

## Repo map

```text
artifacts/
  patternpilot/     React + Vite learner app and the admin Question studio
  api-server/       Express 5 API: grading, diagnosis, drills, waitlist, seed script
  mockup-sandbox/   Design mockup sandbox (not part of the learner app)
lib/
  db/               Drizzle schema, SQL migrations (drizzle/), migration tests
  api-spec/         OpenAPI spec and Orval codegen config
  api-client-react/ Generated React Query client (don't edit by hand)
  api-zod/          Generated Zod schemas (don't edit by hand)
scripts/            Workspace utility scripts
docs/               Product, flow and database docs, plus design screenshots
compose.postgres.yaml  Local Postgres 17 for development
Dockerfile, render.yaml  Production image and Render deployment (see docs/deploy.md)
```

Where to look first:

- Passage content: `artifacts/api-server/src/data/practice-question-seed.ts`
- Answer classification (§5 rules): `artifacts/api-server/src/services/`
- Free limit, price and passage order: `artifacts/patternpilot/src/lib/product-config.ts`

## Further reading

- [`docs/product.md`](docs/product.md): goals, the current milestone, error-pattern rules, UI direction and the decision log
- [`docs/learner-flow.md`](docs/learner-flow.md): how the v0.2 learner flow is built, step-by-step manual checks and diagnosis edge cases
- [`docs/step-3-postgres.md`](docs/step-3-postgres.md): migrations, baseline adoption, seed behavior and production notes
- [`docs/deploy.md`](docs/deploy.md): how the live learner-test site runs on Render, plus redeploy, rollback and backups
- [`docs/v0.2-report.md`](docs/v0.2-report.md): content audit and blank-by-blank coverage
- [`replit.md`](replit.md): notes from the original Replit workspace. The app is no longer hosted there.

### Where older docs disagree with the code

- **Admin auth:** `docs/step-3-postgres.md` says admin endpoints have no authentication. That was fixed later. Every `/api/admin/*` route now requires `Authorization: Bearer <ADMIN_SECRET>`, and if `ADMIN_SECRET` is unset, admin access is turned off.
- **Schema changes:** `replit.md` and `scripts/post-merge.sh` use `db push`. For local and production databases, use migrations as shown above.
- **Hosting:** in production the API also serves the built website, when `STATIC_DIR` is set (the `Dockerfile` does this). For local development, run the API and Vite as two processes as shown above.
