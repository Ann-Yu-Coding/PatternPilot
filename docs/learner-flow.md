# v0.2 learner flow: implementation and local checks

## Run locally

From the repository root, use an existing local Postgres database prepared as described in `docs/step-3-postgres.md`. No new database service is required by this change.

```sh
export DATABASE_URL='postgres://patternpilot:local-development-only@127.0.0.1:5432/patternpilot'
pnpm --filter @workspace/db migrate
pnpm --filter @workspace/api-server seed:questions
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
4. **Two patterns across passages.** Retry Practice 01 using `endent`, `ange`, `ort`, `lient`, `over`, `ed`, `th`, `ve` (**5 / 8**). Next passage must be Practice 02. Enter `d`, `ll`, `ral`, `ibly`, `erable`, `ort`, `idation`, `upt` (**6 / 8**). Expect vertically stacked Word form (**3 similar misses · across 2 passages**) and Grammar ending (**2 similar misses · across 2 passages**). These now exercise actual-answer diagnosis: resilient/survive/flexibly produce Word form, and studyed/support produce Grammar ending.
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

- The server now classifies actual answers in §5 order. The spelling-only dictionary is not a semantic or POS dictionary: explicit POS families cover the seed content and §5 examples; new content should supply accurate metadata and extend families for irregular derivations. Type shows missCategory for wrong answers; correct rows have an empty Type cell. Existing browser history is intentionally not migrated.
- History/free limits are browser-local and can be reset or bypassed by clearing storage. They are a v0.2 product gate, not payment entitlement enforcement. If localStorage is unavailable, only the current page's in-memory fallback survives.
- All passage attempts remain in Progress. Drill scores are displayed at completion but do not create a separate persistent drill timeline.
- Unsubmitted passage/drill drafts are not restored on refresh. Completed passage review is tab-scoped; broader history is localStorage. API sessions are transient: after an API restart, complete a fresh passage attempt before starting its drill.
- The same fixed five built-in sentences are reused for each category. Untouched old seed drills receive the revised content at read time, retaining stored IDs. Custom content is preserved; custom sets shorter than five require an editorial update before the drill is available. No passage text was rewritten.
- Annual pricing, accounts/cross-device sync, real payments, email sending and device/screen-reader QA remain outside these steps.

## Actual-answer diagnosis: exact browser checks

Restart the API after building this change. Run `pnpm --filter @workspace/api-server seed:questions` with your development `DATABASE_URL` first: it repairs exact untouched original metadata only. Admin-edited metadata is not overwritten. The test run used the isolated database only.

Use a fresh browser profile, or retry both passages to replace their latest evidence. Existing history is intentionally left unchanged, so an old unrelated pattern may still appear until replaced or outside the last-five window. Do not type the visible prefix again.

First fill Practice 01 correctly: `endent`, `ange`, `ort`, `lience`, `over`, `ing`, `th`, `val`. Then, in separate retries, change only the indicated field:

| Diagnosis | Visible prefix | Type these missing letters | Full submitted word |
|---|---|---|---|
| Spelling | resi | `lence` | resilence |
| Word form | resi | `lient` | resilient |
| Context / meaning | resi | `stance` | resistance |
| Word retrieval | resi | leave empty, or `zzzzzz` | skipped, or resizzzzzz |
| Grammar ending | study | `ed` | studyed (retained stem + known inflection) |

A single isolated miss gives the corresponding Possible pattern. The `resi` examples show their actual diagnosis in Type: Spelling, Word form or Context / meaning. Correct rows have no tag. Tags matching a displayed Pattern or Possible pattern card are green; other mistake tags are grey. Check the submission response’s `items[].missCategory` for the actual diagnosis (null for correct items). Nothing diagnostic appears in GET practice sets/session blanks.

For a conventional real-word Grammar ending example, use Practice 02, fill `d`, `ll`, `ral`, `ible`, `erable`, `ort`, `idation`, `upt`: `supp` + `ort` gives support where supports is required.

**Cross-passage Spelling pattern on Word-form blanks:**
1. Practice 01: `endent`, `ange`, `ort`, `lence`, `over`, `ing`, `th`, `val` → 7/8, resilence is Spelling.
2. Practice 02: `d`, `ll`, `ral`, `ble`, `erable`, `orts`, `idation`, `upt` → 7/8, flexble is Spelling.
3. Expect **Spelling**, **2 similar misses · across 2 passages**, and a Spelling drill. Both mistaken table rows show Spelling in green. errorCategory is retained internally but not displayed. Retry a completed passage without consuming a third free passage.

### Explicit rule interpretations and limits

- **Input contract:** missing suffix only; surrounding whitespace/case ignored, internal spaces retained. A typed full word is not auto-detected or accepted twice. Empty suffix is skipped, even if the visible prefix could itself be a word.
- **Inflection vs derivation:** inflect the actual noun/adjective/verb, not a derivational source lemma. `consolidate` for `consolidation` is Word form; `hierarchy` for `hierarchies` is Grammar ending.
- **Ending-aware nonwords:** retained base + verbal -s/-es/-ed/-ing counts as Grammar ending before edit distance (`studyed`). An ending that changes POS counts as Word form (`larging` for `largely`). A misspelled stem with no such ending match reaches the spelling check (`resilence`). Compare only typed letters with missing letters: at most one edit for 1–4 missing letters, two for 5+. `studyies` is Word retrieval because `ies` vs `ing` requires two edits. In the Memory passage, enter `pe` after `reca`: this is Word retrieval; in Ecology, enter `lence` after `resi`: this is Spelling. Levenshtein transposition costs two edits.
- **Ambiguous POS:** when a word can share the target POS, do not claim a POS change from the word alone. Same-family, same-POS real alternatives (`careless` for `careful`, `relation` for `relationships`) fall through to Context / meaning.
- **Dictionary membership:** uncommon entries such as `recal` count as real, so they are not Spelling. There is no context-aware frequency filter. An English word absent from the list can be treated as a nonword.
- **Scope:** explicit lexical/POS families cover the three passages and §5 examples, with metadata/ending-based fallback for new words. This is rule-based morphology, not a full English parser; novel irregular forms need content-level review.
- **UI limits:** some unit examples are longer than a blank’s fixed slot count. Tests pass them to the classifier directly; browser steps above all fit existing prefixes and slot limits. UI changes remain out of scope.

**Type-column highlighting check:** after the two-passage Spelling example, retry Practice 02 with `d`, `ll`, `ral`, `ble`, `erable`, `ort`, `idation`, `upt`. Spelling matches the displayed pattern and stays green; the single Grammar ending tag for support is grey. All six correct rows have truly empty Type cells, without a dash. A single miss in fresh history also gets a green tag when it matches the Possible pattern card.
