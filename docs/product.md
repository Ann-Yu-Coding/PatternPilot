# PatternPilot — Product Source of Truth

This is the single source of truth for product decisions. Every tool (Codex, ChatGPT, Claude) and every contributor reads this before working. **Whenever a decision is made anywhere, update this file.**

Last updated: 2026-09-28 (UI direction added)

---

## 1. What PatternPilot is

A practice tool for the **"Complete the Words"** task in the new TOEFL format. Learners fill in missing word endings in short academic passages. PatternPilot then tells them **why** they got answers wrong (the error pattern) and gives them a short targeted drill for that pattern.

**Positioning:** *Your score is a signal, not a verdict.* Every session should end with one clear next step, not just a number.

## 2. Target users and markets

- **Who:** TOEFL test-takers preparing for study abroad, especially those who can understand passages but lose points on word forms and endings.
- **Where:** Japan, Korea, Europe. **Not mainland China.** Marketing channels, payment methods and operations differ, so China is out of scope.
- **Market notes:**
  - Korea is likely the strongest TOEFL market. Prioritize it for early tests and a Korean landing page.
  - Japan: many learners take TOEIC or Eiken instead. TOEFL demand comes mainly from study-abroad applicants.
  - Europe: IELTS is often preferred. Learners in Europe are a secondary audience.
- **UI language:** English first. Korean (then Japanese) translations of the landing page come after demand is shown.

## 3. Current milestone: v0.2

> **PatternPilot v0.2 = one polished learning loop, 3 original passages, safe admin access, and a diagnosis worth paying for.**

**Deadline:** 2026-10-12 (about 2 weeks)

### Scope, in this order
1. **Admin protection**
   - Protect `/admin/questions` and every `/api/admin/*` route.
   - Remove or hide the "Question studio" link from the normal learner UI.
   - An admin secret stored as a server environment variable is enough for the MVP.
2. **Stop backend and infrastructure work.** The database layer is good enough for now.
3. **Redesign one complete learner flow:**
   `Complete the Words → Submit → See mistakes → Understand pattern → Start targeted practice`
   Design the whole flow first (see §7, UI direction), then build it.
4. **3 excellent original passages**, deliberately designed to trigger every error type in §5 so they exercise the scoring and diagnosis system.
5. **Keep practicing:** after results, a **Next passage** card sends the learner to the next passage they haven't done. This repeats until the **free limit (2 unique completed passages, configurable)**. After that, *Next passage* opens the **paywall** screen. In v0.2 the paywall's button leads to a waitlist or pre-order page (no real payment yet, see §8). Retries and targeted drills don't count toward the limit. Next passage follows the fixed seeded order and chooses the next uncompleted passage.
6. **Progress page** (§7, screen 4): shows how the loop works over time, from patterns to drills to cleared. Browser storage only.

### Out of scope for v0.2
- More than 3 passages
- Real payments (see §8). The paywall screen exists but its button goes to a waitlist or pre-order page.
- User accounts, beyond what the learning loop needs (practice history and the free-passage count live in the browser for v0.2)
- New backend features or infrastructure

### Definition of done
- [x] Admin routes and page protected, and the link hidden from learners
- [ ] The full learning loop works end-to-end with 3 original passages
- [ ] **5 real TOEFL learners** (ideally from Korea, Japan or Europe) have tried the loop, e.g., locally over a video call
- [ ] **At least 3 of 5** say the diagnosis told them something useful
- [x] Landing page has no placeholder or made-up numbers (e.g., "14,280 words mapped", "© 2025")

### Decision after v0.2
- **Useful feedback and demand signals:** set up payments and run a real ads test (§8, §9).
- **Weak response:** revise the diagnosis or the concept, or keep the project as a portfolio piece.

## 4. Content rules (passages)

Real TOEFL "Complete the Words" questions are used **only as blueprints**, never as published content.

For each source question, record only the blueprint:
- topic area (e.g., ecology, psychology, archaeology)
- which words are blanked, and their type (noun suffix, verb ending, adjective or adverb form, word family, etc.)
- difficulty and where the blanks fall in the passage

Then write a **completely new passage** from the blueprint, with new sentences and a new specific subject. AI drafting is fine; a human reviews every passage. **Don't paraphrase sentence by sentence.** A close paraphrase can still infringe copyright.

Every blank must fill in the existing fields: `prefix`, `correctAnswer`, `fullWord`, `lemma`, `partOfSpeech`, `wordFamily`, `root`, `linguisticPrefix`, `suffix`, `errorCategory`, `tags`.

## 5. Error pattern rules (diagnosis v1)

Rule-based, no AI needed for v1. Compare each wrong answer (prefix + typed letters) with the correct full word:

| Learner input | Pattern | Example (correct: *suggests*) |
|---|---|---|
| Empty | **Skipped / time pressure** | — |
| Same lemma, different inflection (-s / -ed / -ing / -er / -est) | **Grammar ending** | suggest, suggested |
| Same word family, different part of speech | **Word form** | suggestion |
| Not a real word, and the **typed letters** are close to the **missing letters** (edit distance ≤ 1 when 4 or fewer letters are missing, ≤ 2 when 5 or more) | **Spelling** | sugests |
| A real word with a different lemma | **Meaning / context** | supports |
| Not a real word and not close | **Vocabulary gap** | sugrom |

Check the rules in the order shown. The first match wins.

**Spelling closeness ignores the given prefix.** Comparing whole words would make almost any short guess look close, because the prefix is shared. Example: *reca__* for *recall*: typing `pe` (both letters wrong) is **Word retrieval**, not Spelling; typing `l` is Spelling.

**Ending-aware matching:** if the answer keeps the stem and adds a known ending (-ing, -ed, -s, -ly, -tion, -ment, -ful, -al, -ence, etc.), classify it by that ending even when the result is not a real word. Example: *larging* for *largely* is **Word form**, not **Vocabulary gap**.

**Explanation per blank:** every blank (correct or not) has one short *Why this answer* line, written per blank in a teacher's voice: quote the original sentence and explain the blank, with little jargon and no fixed template (see §7). The classification above decides the **Type** tag and the pattern. It is not shown as a "you did X" sentence.

**Learner-facing error labels:** Grammar ending · Word form · Spelling · Word retrieval · Context / meaning. Skipped answers are recorded under Word retrieval. Scores are raw correct/total only, never TOEFL-scaled.

**Pattern detection:**
- Patterns are found **across passages, not just within one passage**. Keep a history of every miss (category, passage, date). For v0.2 there are no accounts, so store it in the browser (`localStorage`); move it to the server when accounts arrive.
- Only the **latest attempt for each distinct passage** contributes evidence. Retries replace that passage’s previous evidence; all attempts remain in Progress history. Use the five most recently attempted distinct passages. Rank by miss count descending, then latest occurrence descending. Show up to two qualifying cards stacked vertically.
- A **pattern** is a category with **2 or more misses across the learner's last 5 passages**, without recency weighting. The card shows the evidence, e.g. *"3 similar misses · across 2 passages"*.
- **Possible pattern:** if no category reaches 2 misses but this passage has at least one mistake, show the category of that mistake as a *possible* pattern (if several, the one seen most often in history, then the most recent). It still offers the targeted drill, framed as a check: *"Check with 5 sentences · if you get them all, we drop it."* Only 5/5 clears that category’s misses currently contributing to the recent window. Non-perfect results do not clear evidence. Older excluded attempts and unrelated categories remain intact.
- **No mistakes:** no pattern card. Say “No repeated pattern detected in this passage.” and show the next passage.
- Show at most **1–2 patterns per session**, most frequent first. The goal is one clear next step, not a report.

**Targeted practice:**
- Each pattern maps to a `weakness_categories` row: a short explanation (what the pattern is, and the signal to look for in the passage) and a **5-item drill** from `targeted_drills`.
- Diagnosis text must be concrete, e.g., *"You recognized the meaning. The ending was the signal: after a singular subject, look for the third-person -s."*

## 6. Admin and question management

- The question editor ("Question studio") is admin-only and protected by an environment-variable secret.
- A database table editor (e.g., Drizzle Studio or the hosting provider's editor) is fine for quick edits. No extra admin UI is needed for now.
- Never expose correct answers or diagnostic metadata through public APIs. The existing tests cover this; keep them passing.

## 7. UI direction

**Visual reference (source of truth for the look):** [PatternPilot Visual Direction canvas](https://claude.ai/artifact/1LE6fjV22o6BTv44hGz7aT). It has three boards: *Visual standard*, *Passage · desktop* and *After Check answers · desktop*, plus *Drill · phone*. If this section and the canvas disagree, the canvas wins. Ask the owner for access if you can't open it.

**Screenshots (for agents that can't open the canvas):**
- [`docs/design/01-visual-standard.png`](design/01-visual-standard.png): colors, type and components
- [`docs/design/02-passage.png`](design/02-passage.png): the practice screen
- [`docs/design/03-after-check-answers.png`](design/03-after-check-answers.png): the marked passage and results on one page
- [`docs/design/04-drill-phone.png`](design/04-drill-phone.png): the targeted drill on a phone
- [`docs/design/05-practice-picker.png`](design/05-practice-picker.png): the practice picker, open
- [`docs/design/06-possible-pattern.png`](design/06-possible-pattern.png): results with only one mistake (possible pattern + next passage)
- [`docs/design/07-paywall.png`](design/07-paywall.png): the free limit reached

### Principles
1. **Reading comes first.** Passages and example sentences use the serif font. Everything around them stays small and quiet.
2. **One green.** Green is the brand color and the only action color. Orange is used only for mistakes.
3. **Never rely on color alone.** Correct answers get a check mark or underline. Mistakes are crossed out. Both still read in grayscale.
4. **Mostly flat.** Use lines instead of boxes. Depth comes only from a soft bottom edge on buttons, the timer and the pattern card. No gradients, no generic "AI SaaS" styling.

### Tokens
| Token | Value | Use |
|---|---|---|
| Ground | `#F6F6F3` | Page background |
| Surface | `#FFFFFF` | Cards, secondary buttons |
| Ink | `#17231F` | Main text |
| Ink secondary | `#55605B` | Secondary text |
| Muted | `#6B7570` | Hints, labels |
| Line | `#E3E4E0` | Dividers |
| Green | `#2E6B55` (dark `#23513F`, edge `#1F4D3C`) | Brand, primary buttons, active states |
| Green line | `#3B7A63` | Underlines for filled or correct words |
| Mint | `#EAF4EE` (border `#CFE3D8`, edge `#B9D8C7`) | Pattern card, timer |
| Green tint | `#E3EFE9` | Current word highlight, retry button, pattern tag |
| Mistake | `#C2410C` (background `#FBEDE5`) | Wrong letters, mistake highlight |

- **Fonts:** Geist for headings, labels, buttons and numbers. **Source Sans 3** for explanation and body text (16–17px, color `#3A4540`); it's much easier to read than Geist at small sizes. Source Serif 4 for anything the learner reads (passages, drill sentences, answer words).
- **Radius:** buttons 10px · tags 4px · highlights 6px · pattern card 22px · timer fully rounded.
- **Depth:** a 3px darker bottom border (4px on the pattern card). The pattern card may add one soft green shadow.
- **Type scale (desktop):** wordmark 20 · nav tabs 14 · page heading 34 (line-height 1.3) · passage title 24 · **passage 22 serif, line-height 1.8** · subheading 16 · meta 13 · timer 18 · buttons 15 · small hints 12. Nothing below 12px.
- **Spacing:** 8px grid. Content column **825px** wide on desktop (about 75 characters per line). Vertical gaps between blocks 12–24px; heading block (label → heading → subheading) has a little more air (12px / 10px).
- **Fit:** on a 1440×800 laptop window at 100% zoom, the whole practice screen (passage and **Check answers**) must fit without scrolling. The reference design ends at about 600px.

### Components
- **Top nav:** lowercase `patternpilot` wordmark · *Practice* / *Progress* tabs (active tab has a 3px green underline) · account avatar.
- **Buttons:** Primary = green fill with white text. Secondary = white fill with a gray border. Retry = green tint with dark-green text and a rotate-back icon (Lucide `rotate-ccw`). All three have a 3px bottom edge.
- **Timer:** mint pill with a ring countdown and bold numbers. **Default 3:00.** The ring shrinks as time runs out.
- **Word blanks:**
  - Empty: a gray short line under each missing letter.
  - Typing: the current word gets a green-tint background. Typed letters have a green underline **below** the letter, never through it. Show a caret.
  - Filled: the whole word gets a green underline.
- **Practice picker:** never use the browser's native `<select>` menu. The trigger is plain text *"Practice 01"* with a chevron; when open it gets a green-tint background. The menu is a white card (12px radius, 1px border, 3px bottom edge, soft shadow), about 340px wide. Each row is at least 44px tall and shows: number (`01`), passage title, topic · time, and on the right the status: a green check for the current practice, the last accuracy for finished ones (e.g. **75%** in bold with a small *"correct"* below it); practices not started yet show nothing on the right (no "New" tag). The selected row has a green-tint background. See `docs/design/05-practice-picker.png`.
- **Pattern tags:** 4px radius. Tint `#E3EFE9` for the learner's main pattern, neutral gray for other types.

### Screens
**1. Passage (practice)**
- Label `READING / COMPLETE THE WORDS`.
- Heading: *"Complete each word with the missing letters."* Subheading: *"A little practice. A clearer pattern."*
- Meta row: `Practice 01 | Environmental science` on the left, timer on the right.
- Passage title, then the serif passage with the blanks.
- Bottom: one row directly under the passage, right-aligned: the hint *"Tab to move between words"*, then the **Check answers** button. No word counter, no *"You can check with blanks left"* text and no footer.

**2. After Check answers (one page, not two)**
- **Top: the passage, marked in place.** Correct words get a green underline. Mistakes get an orange-tint background, with the wrong letters crossed out and followed by the correct letters. A legend above uses the words themselves as samples: *correct* (underlined) `5` and *mistake* (styled as a mistake) `3`.
- **Below: the results** (the page opens scrolled to this point, but a line or two of the passage should still show at the top so learners know they can scroll up):
  - `5 of 8 correct · 5:21`
  - **Pattern card** (mint, 22px radius): a solid green *PATTERN FOUND* badge, the pattern name in large type with a highlighter mark (e.g., *Word **form***), one line of feedback (*"Right word family, wrong job in the sentence."*), the **seen-dots** (one filled dot per time this pattern has been seen, with a small "seen 3 times" label) and an evidence line (*"3 similar misses · across 2 passages"*), and the **Practice word form →** button with *"Practice 5 more like this · 2 min"*.
  - **All answers table:** four columns: *Your answer · Correct · Type · Why this answer*. Mistakes come first, then a `CORRECT · 5` subheading. For correct words, the Correct column shows a green check.
    - **Why this answer column** (Source Sans 3, 15–16px): write it the way a teacher would when marking: **quote the original sentence and explain this blank**. Don't keep pointing out what the learner did wrong, avoid grammar jargon, and don't force every row into the same template. Examples: *"'Increases the' needs a noun here: resilience."* · *"'Growth and survival' pairs two nouns."* · *"'Are now studying' describes an action in progress."* · *"'Can support' takes the plain verb."*
  - **Possible-pattern variant** (when no category has 2+ misses): the **same mint card** as the pattern card (same highlighter, depth and button), with two differences: the badge is *POSSIBLE PATTERN* in white with a dashed green outline (instead of solid green), and the seen-dots show one filled dot plus one **dashed empty dot** (the threshold). Copy: *"Just one slip here, but it looks like the kind that tends to repeat."* and *"Seen once so far · one more makes it a pattern"*. Button: **Check with 5 sentences →**.
  - **Seen-dots** are the shared indicator for both cards: filled green dot = one occurrence; dashed empty dot = still needed to become a pattern. No ring chart.
  - **Next passage card** at the bottom (white card with a 3px bottom edge): `NEXT PASSAGE` label, title, *topic · 3 min · N free passages left*, a **Try again** retry button, and a primary **Next passage →** button.
  - **Paywall** (when the free limit is reached): a centered white card with *"You've used your 2 free passages."*, a mint summary (*"13 of 16 correct · Pattern: Word form"*), three short benefits, a primary **Unlock full access · [PRICE]** button, and a text link *"Not now: review my answers"*. See `docs/design/07-paywall.png`.
- **Table rules:** answer words must never break across lines (`white-space: nowrap`); if space is tight, the *What happened* column shrinks instead. Every row, including correct answers, gets its **own** Why line written for that blank (never a generic line like *"Correct form for this sentence."*). The Type tag names the skill that blank tests (from the blank's `errorCategory`), not a guess from the learner's answer.
- There is no separate review page.

**3. Targeted drill (phone reference)**
- Close button, segmented progress (5 steps), `3/5`.
- `WORD FORM PRACTICE` label, the serif sentence, and inline feedback (✓ *Correct* plus an explanation) separated by a thin line. Full-width green **Next** button.

**4. Progress** (see `docs/design/08-progress.png`)
Order: summary → Patterns & practice (table, then one drill-accuracy chart) → Passages. Calm and editorial: section headings with thin rules, no KPI cards, no passage chart. Never TOEFL-scaled. Passage figures use the **latest attempt per distinct passage**, as in pattern detection.
- **Summary line:** `3 passages · 75% accuracy · 4 targeted drills` (large numbers, small words, one line). Accuracy = correct blanks ÷ all blanks, latest attempt per passage, rounded to a whole percent.
- **Patterns & practice** (the learner's *mistake types*, last 5 passages). Columns: *Pattern · Status · Evidence · Practice · Action*. One row per category that has at least one miss in the window, or that was cleared by a drill. Order: Pattern, then Possible pattern, then Cleared; within a status, by miss count, then most recent.
  - **Status:** plain text labels, not badges, so they don't look clickable (15px). *Pattern* (2+ active misses; filled green dot) · *Possible pattern* (1 active miss; dashed empty dot, as in the seen-dots) · **Cleared** (a 100% drill cleared its misses and no new miss has come since; green check, gray text). No other labels.
  - **Evidence:** `3 misses · 2 passages`; possible: `1 miss · 1 passage`; cleared: `2 misses · 2 passages / cleared by a 100% drill`.
  - **Practice:** latest drill accuracy in bold and the change from the previous drill, e.g. **80%** / +20% since last (no change line after a single drill). Never drilled = *Not practiced*.
  - **Action:** quiet green text links with an arrow (14px, 600), not buttons: **Practice again →** (or **Practice →** if never drilled), **Check with 5 →** for a possible pattern, **Practice again →** for cleared. Progress is a place to look back; the drill CTA on the results page stays the primary button.
  - Footnote: *"A 100% drill clears a pattern until the same kind of miss comes back."*
- **Drill accuracy over time:** one white card under the table (12px radius, 3px bottom edge, 36px above it). Title plus a legend; one line per pattern that has been drilled (main pattern in green `#2E6B55`, others in gray-green `#7F948A`); x = drill date in order, y = accuracy 0–100% with a dashed line at 100%; each dot labelled with its %, e.g. `80%`, placed so labels never sit on a line (the change from the previous drill is shown in the table). Hidden until at least one drill exists. This is the only skill-accuracy view on the page; the separate "Skills tested" section was dropped (see §10).
- **Passages:** newest first; title, `topic · date` (plus `tried twice` when retried), a small score bar, `7 / 8`, and a **Review** link to that passage's results.
- **Empty state** (no passages yet): one line, *"Finish a passage to see your patterns here."*, and a **Start practice** button.
- **Data needed (browser storage, v0.2):** a drill log `{category, score, total, timestamp}` (for drill counts, the chart, latest result and Cleared).

## 8. Payments (after v0.2)

- Use a **merchant of record** (Paddle, Lemon Squeezy or Creem) so EU VAT, Japanese consumption tax and Korean VAT are handled by the provider. **Check that the provider accepts sellers based in China and supports payouts to them before choosing.**
- Stripe doesn't accept sellers based in mainland China. Don't use it.
- Start as an individual seller. Register a company only once revenue justifies it.
- Minimal setup: a hosted checkout link, plus a webhook to the server that unlocks full access. Identify users either by email login or by a license key issued by the provider.
- Until then, any "Unlock full access" button can lead to a waitlist or pre-order page.

## 9. Testing demand (can run alongside v0.2)

- A simple landing page with a clear price and a **waitlist or pre-order** button.
- A small ad budget with a hard cap (e.g., US$100–200), Korea first.
- Funnel to track: **ad click → try free passages → see diagnosis → start checkout (or join waitlist) → pay**.

## 10. Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-27 | Question storage moved to Postgres | Durable question bank |
| 2026-09-28 | Target Japan, Korea and Europe, not China | Different operations and payment methods |
| 2026-09-28 | v0.2 = one polished loop with 3 passages, not 15 | Validate the diagnosis before producing lots of content |
| 2026-09-28 | Stop backend work after admin protection | Infrastructure is ahead of the product |
| 2026-09-28 | Real questions used only as blueprints | Copyright |
| 2026-09-28 | v0.2 success = 5 real learners, at least 3 find the diagnosis useful | Needs outside validation, not only the founder's judgment |
| 2026-09-28 | Payments via a merchant of record, after v0.2 | Handles tax in each market; no company needed to start |
| 2026-09-28 | UI direction set (§7): green brand, serif reading surface, flat with soft depth | Visual standard agreed on the design canvas |
| 2026-09-28 | Marked passage and results on one page after Check answers | Learners see mistakes in context without switching pages |
| 2026-09-28 | Every mistake shows "You" and "Why" lines; ending-aware matching | The explanation must respond to what the learner actually typed |
| 2026-09-28 | Timer defaults to 3:00 | Short, focused sessions |
| 2026-09-28 | Patterns tracked across passages; single mistakes shown as a "possible pattern" with a drill | One passage is too little evidence; learners should always get a next step |
| 2026-09-28 | Next passage flow until 2 free passages, then a paywall (waitlist in v0.2) | Keeps learners practicing and tests willingness to pay |

### Learner UI implementation notes (2026-09-28)

- Admin access requires the API-only ADMIN_SECRET through a Bearer header. The editor prompts before loading data, keeps the secret only in memory and clears its isolated query cache on lock or navigation.

- The 3:00 timer is advisory: at zero, learners can still finish and submit. Results show actual elapsed time, which can exceed three minutes.
- Pattern evidence now uses the latest attempt from each of the last five distinct passages. Both repeated and possible patterns offer a category-specific drill; a 5/5 drill clears only that category’s misses contributing to the current five-passage window. All attempts remain visible in Progress. The next-passage card now routes to the next unfinished seeded passage or to the waitlist offer after two unique completions.
- The first two screens reuse the current scoring response. All 24 original blanks now have server-side editorial explanations, shown under Why this answer for correct and incorrect responses alike. Type displays the blank’s errorCategory. Exact-answer scoring remains unchanged. Browser pattern aggregation follows the confirmed §5 rules, but error categories still come from the blank’s tested skill (empty answers use Word retrieval), not the complete ordered answer-sensitive classifier in §5. Each built-in drill has five items; no answer metadata is added to public passage responses.
- The practice picker uses the latest saved accuracy in this browser. Switching passages starts a fresh attempt; cross-device history is outside this change.

### Decisions confirmed during implementation

- Retries replace pattern evidence for that passage; attempt history is retained for Progress. A perfect drill clears earlier active evidence for its category without deleting historical scores.
- Initial offer: **US$5/month**; annual pricing is undecided. v0.2 collects interest only, without charging.
- Waitlist emails are stored in a small table in the existing Postgres database.

- Targeted practice shows one sentence at a time. Checking an item returns only that item’s feedback; final grading uses all five answers. Untouched legacy seed drills are upgraded to the five-item editorial catalog at read time while keeping existing IDs. Custom database content is preserved and a custom drill with fewer than five items is unavailable until completed.

## 11. Open questions

- Future pricing: annual option and market-specific tiers remain undecided; the current offer is US$5/month.
- Free tier: 2 passages for now (configurable). Revisit after the ads test.
- Where to find the 5 v0.2 test learners in Korea, Japan and Europe?
- Which merchant of record accepts sellers based in China?
