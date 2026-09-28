# Learner flow — §7 implementation

The practice picker uses the existing Radix dependency and remembers last accuracy in tab-scoped session storage.

The practice and after-check screens live in `artifacts/patternpilot/src/components/learner-flow.tsx`. `/practice` and the legacy `/results` URL render the same combined flow. No separate review screen is created. The training CTA uses the current session and the existing training page; the drill redesign is a later task.

## Run locally

From the repository root, prepare the normal local development database following `docs/step-3-postgres.md`, then run these in separate terminals. Port 5059 avoids the macOS service already using 5000.

```sh
export DATABASE_URL='postgres://patternpilot:local-development-only@127.0.0.1:5432/patternpilot'
PORT=5059 pnpm --filter @workspace/api-server dev
```

```sh
PORT=5173 BASE_PATH=/ API_PROXY_TARGET=http://127.0.0.1:5059 pnpm --filter @workspace/patternpilot dev
```

Open http://localhost:5173/practice.

The implementation was verified against an isolated temporary PostgreSQL database, not the owner's existing database.

## Check the flow

1. Open the practice picker. Check passage titles, topics, the current check mark, keyboard arrows and Escape. After submitting and retrying, switch passages to see the previous passage’s last accuracy. Open Practice 01. Check the 3:00 ring timer, the serif passage, and individual blank marks. There is no completion counter.
2. Fill `indep` with `endent`. Focus moves to `exch`. Shift+Tab returns to the end of the completed answer; Backspace removes its final letter.
3. Try this suffix sequence: `endent`, `ange`, `ort`, `lient`, `over`, `ies`, `th`, `ve`. Use Tab after incomplete words. Submit. Expect 5/8, three in-place corrections, the existing Noun formation pattern (2/3), and wrong answers before correct answers. The literal `study` prefix means `ies` is submitted as `studyies`; the UI must show the actual answer, not silently change it to `studies`.
4. On submission, the results appear in the same page and the initial scroll retains the end of the passage above the results. Scroll up to see all contextual corrections.
5. Click the pattern CTA. The existing training page loads the drill for that session. Return with browser Back: the combined page is retained.
6. Refresh: the completed review is retained for the browser tab. Click Try this passage again: all answers clear and the timer returns to 3:00.
7. Try all-correct answers (`endent`, `ange`, `ort`, `lience`, `over`, `ing`, `th`, `val`): no error-pattern card appears. Leave only `survi` blank: expect 7/8, a skipped answer and no repeated pattern.
8. Check 390px and 320px widths. The header must fit; the answer table should reflow into labeled rows.

## Validation commands

```sh
pnpm --filter @workspace/patternpilot typecheck
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/patternpilot build
pnpm --filter @workspace/api-server exec tsx --test ../patternpilot/src/lib/learner-review.test.ts
# Use a dedicated migrated test database; never use your normal database here.
TEST_DATABASE_URL='postgres://patternpilot:local-development-only@127.0.0.1:5432/patternpilot_test' pnpm --filter @workspace/api-server test
```

Verified: frontend typecheck and production build, 4 review-helper tests, 32 API/data tests including answer secrecy, and the browser cases above. The build reports the existing tooltip sourcemap warning but completes.

## Current boundaries

- The countdown is advisory; elapsed result time may exceed three minutes.
- Diagnosis remains server-owned. Current diagnosis categories predate §5. Each of the 24 original blanks has a teacher-style explanation returned only after submission; Type uses the blank’s errorCategory. The actual drill count is shown, not the reference's sample count of six.
- Only the backend's primary diagnosis with at least two misses is highlighted. No pattern is claimed for an all-correct or single-miss result.
- Passage selection starts a fresh attempt. Unsubmitted drafts are not restored on refresh. Completed reviews are restored from tab-scoped storage. API sessions remain transient: if the API restarts, retry the passage before starting training.
- Mobile layout was checked in a desktop browser at narrow widths; native mobile keyboards and screen-reader interaction still need device testing.
