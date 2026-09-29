# v0.2 learner flow: implementation and local checks

## Run locally

From the repository root, use an existing local Postgres database prepared as described in `docs/step-3-postgres.md`. No new database service is required by this change.

```sh
export DATABASE_URL='postgres://patternpilot:local-development-only@127.0.0.1:5432/patternpilot'
pnpm --filter @workspace/db migrate
export ADMIN_SECRET='choose-a-local-admin-secret'
PORT=5059 pnpm --filter @workspace/api-server dev
```

In another terminal:

```sh
PORT=5173 BASE_PATH=/ API_PROXY_TARGET=http://127.0.0.1:5059 pnpm --filter @workspace/patternpilot dev
```

Open http://localhost:5173/practice. The API build is not watched: restart its dev command after server changes. Frontend changes reload automatically. Apply the migration before testing the waitlist; it adds only `waitlist(email, created_at)` to the existing database.

## Implemented steps and commits

| Step | Commit | Outcome |
|---|---|---|
| 0 | `6004270`, `a20cda4` | Save prior learner flow, inline slots, picker, editorial explanations and tests; ignore screenshots; synchronize product notes |
| 1 | `eee9a36` | Guard every admin API route with ADMIN_SECRET; memory-only editor gate; no learner admin link |
| 2 | `dbdbc0f`, `8ab3bf6` | Latest attempt per distinct passage, recent five-passage evidence, possible patterns, maximum two vertical cards, Progress attempt history; incorporate confirmed unweighted ranking and exact 5/5 clearing |
| 3 | `e2e6771` | Next unfinished seeded passage; two unique free completions; configured $5/month waitlist offer; normalized/deduplicated Postgres waitlist |
| 4 | `216e05c` | Five sentence items, one at a time, per-item server feedback, inline slots, segmented progress, mobile Next; correct and incorrect items both receive specific explanations |
| 5 | `e7b14d0` | Editorial landing page; remove invented statistics; dynamic copyright year; offer copy reads config |

`src/lib/product-config.ts` in the frontend owns `FREE_PASSAGE_LIMIT`, `MONTHLY_PRICE_USD`, and `SEEDED_PASSAGE_ORDER`. `/results` and `/practice` reuse the combined passage/results component. `/training` accepts the existing session and category. `/unlock` opens `/waitlist`, which collects interest without payment.

## Manual checks

Use a fresh browser profile for a clean history. Alternatively clear this localhost site's storage in your browser developer tools and reload; this removes that browser's saved practice history. Do not clear a learner's real history just to run tests.

1. **Slots, caret and fit.** At 1440×800 and 100% zoom, the full first passage and Check answers fit; measured button bottom: 735px. Fill `indep` with `endent`: focus advances to `exch`. Shift+Tab returns to the completed answer at position 6. Each typed character replaces one slot. Tab remains normal; incomplete blanks can be submitted. At zero the advisory timer stops, without a timeout sentence or forced submission.
2. **Possible pattern.** For Practice 01, enter suffixes in order: `endent`, `ange`, `ort`, `lient`, `over`, `ing`, `th`, `val`. Expect **7 / 8**, a possible Word form observation and **1 similar miss · across 1 passage**. The sentence records `resilient` exactly as typed. The CTA opens five sentences.
3. **Perfect drill.** The Word form drill's suffixes are `tion`, `ment`, `ance`, `ence`, `ment`. Check each answer, then Next; finish after item five. Expect **5 / 5** and the category's current-window evidence cleared. Return to answers: no active pattern remains in this clean example. Original passage score remains in Progress. Closing an unfinished drill does not clear evidence.
4. **Two patterns across passages.** Retry Practice 01 using `endent`, `ange`, `ort`, `lient`, `over`, `ies`, `th`, `ve` (**5 / 8**). Next passage must be Practice 02. Enter `d`, `ll`, `ral`, `xxxx`, `erable`, `ort`, `idation`, `upt` (**6 / 8**). Expect vertically stacked Word form (**3 similar misses · across 2 passages**) and Grammar ending (**2 similar misses · across 2 passages**). These are aggregation checks using the current skill-based error categories, not validation of the unfinished answer-sensitive classifier.
5. **Non-perfect drill.** In the Word form drill, enter `xxxx` first and the other four correct suffixes above. Expect **4 / 5** and unchanged pattern evidence. The first feedback says Not quite and shows a correction and explanation. Checking item one must not reveal answers to items two–five in the response.
6. **Free limit/paywall.** After the two distinct completions, Next passage opens **You've used your 2 free passages**. The summary uses latest attempt totals (11 / 16 in step 4), not retry totals. Selecting Practice 03 in the picker also opens the offer. Retrying either completed passage is allowed and does not use another free passage. The offer is **$5/month**, routes to the waitlist, and clearly says no payment is taken.
7. **Waitlist.** Enter a test email; success appears only after the server saves it. A repeated address is deduplicated; invalid addresses are rejected. An unavailable database returns an error, not a false success. The browser QA address was saved only to the isolated test database. There is no email delivery integration; contacting the list is a later/manual operation.
8. **All correct and Progress.** Retry Practice 02 with `d`, `ll`, `ral`, `ible`, `erable`, `orts`, `idation`, `upt`. Expect **8 / 8**, no pattern cards, **Nice work — no repeated pattern showed up here.**, followed by **Try one more passage to check for smaller gaps that didn’t appear in this one.**, and **Check another passage →**. This CTA follows the same free-limit routing as Next passage. Progress keeps both earlier and latest attempts, while summary and pattern evidence use only the latest for each passage. All-correct Practice 01 suffixes: `endent`, `ange`, `ort`, `lience`, `over`, `ing`, `th`, `val`.
9. **Admin.** Without a header, `curl -i http://localhost:5059/api/admin/questions` returns **401**. An incorrect token also returns 401, as does an unset/empty server secret. With `Authorization: Bearer <ADMIN_SECRET>`, the editor APIs work. `/admin/questions` shows only its gate before verification. Locking, leaving the page or refreshing clears its memory-only credentials and isolated query cache.
10. **Small screens.** Check practice, results, Progress and paywall at 320px: no horizontal page overflow. Drill checked at 390×844: one serif sentence, inline explanation, full-width bottom action. Test actual mobile keyboards and screen readers separately; desktop viewport emulation does not replace device testing.

## Verification

Run destructive database tests only against a dedicated migrated test database, never normal learner/admin data:

```sh
PORT=5173 BASE_PATH=/ pnpm build
TEST_DATABASE_URL='postgres://user:password@127.0.0.1:5432/patternpilot_test' pnpm --filter @workspace/api-server test
TEST_DATABASE_URL='postgres://user:password@127.0.0.1:5432/patternpilot_test' pnpm --filter @workspace/db test:migrations
pnpm --filter @workspace/api-server exec tsx --test ../patternpilot/src/lib/practice-history.test.ts ../patternpilot/src/lib/learner-review.test.ts ../patternpilot/src/lib/free-practice.test.ts
```

The final build includes workspace typechecking. API tests cover all public passage/drill projections, authenticated admin operations, waitlist persistence and per-item answer secrecy. History tests cover repeated/cross-passage evidence, retry replacement, recency tie-breaking, two-card cap, all-correct and exact category/window clearing.

## Boundaries and remaining work

- **The ordered §5 answer-sensitive classifier is not implemented by these steps.** Exact-answer grading and per-blank editorial explanations are preserved. Non-empty misses currently inherit the blank's tested skill, normalized to the five labels; empty answers become Word retrieval. For example, nonsense in a Word form blank still counts as Word form. Do not represent this as a completed spelling/lemma/real-word diagnosis. See the content audit in `docs/v0.2-report.md`.
- History/free limits are browser-local and can be reset or bypassed by clearing storage. They are a v0.2 product gate, not payment entitlement enforcement. If localStorage is unavailable, only the current page's in-memory fallback survives.
- All passage attempts remain in Progress. Drill scores are displayed at completion but do not create a separate persistent drill timeline.
- Unsubmitted passage/drill drafts are not restored on refresh. Completed passage review is tab-scoped; broader history is localStorage. API sessions are transient: after an API restart, complete a fresh passage attempt before starting its drill.
- The same fixed five built-in sentences are reused for each category. Untouched old seed drills receive the revised content at read time, retaining stored IDs. Custom content is preserved; custom sets shorter than five require an editorial update before the drill is available. No passage text was rewritten.
- Annual pricing, accounts/cross-device sync, real payments, email sending and device/screen-reader QA remain outside these steps.
