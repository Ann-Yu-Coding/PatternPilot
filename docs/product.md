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

### Out of scope for v0.2
- More than 3 passages
- Payments (see §8)
- User accounts, beyond what the learning loop needs
- New backend features or infrastructure

### Definition of done
- [ ] Admin routes and page protected, and the link hidden from learners
- [ ] The full learning loop works end-to-end with 3 original passages
- [ ] **5 real TOEFL learners** (ideally from Korea, Japan or Europe) have tried the loop, e.g., locally over a video call
- [ ] **At least 3 of 5** say the diagnosis told them something useful
- [ ] Landing page has no placeholder or made-up numbers (e.g., "14,280 words mapped", "© 2025")

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
| Edit distance 1–2 from the correct word, not a real word | **Spelling** | sugests |
| A real word with a different lemma | **Meaning / context** | supports |
| Not a real word and not close | **Vocabulary gap** | sugrom |

Check the rules in the order shown. The first match wins.

**Ending-aware matching:** if the answer keeps the stem and adds a known ending (-ing, -ed, -s, -ly, -tion, -ment, -ful, -al, -ence, etc.), classify it by that ending even when the result is not a real word. Example: *larging* for *largely* is **Word form**, not **Vocabulary gap**.

**Every mistake gets two lines:**
- **You:** what the learner did, generated from their answer (e.g., *"wrote the adjective 'resilient'"*, *"added -ing, a verb ending"*).
- **Why:** why the correct answer fits, written per blank (e.g., *"After 'increases the', you need a noun: resilience."*).

Correct answers get only a **Why** line.

**Pattern detection:**
- A **pattern** is a category with **2 or more misses** in one session (later: across recent sessions, weighted toward recent ones).
- Show at most **1–2 patterns per session**, most frequent first. The goal is one clear next step, not a report.

**Targeted practice:**
- Each pattern maps to a `weakness_categories` row: a short explanation (what the pattern is, and the signal to look for in the passage) and a **5–8 item drill** from `targeted_drills`.
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

- **Fonts:** Geist for the interface. Source Serif 4 for anything the learner reads (passages, drill sentences, answer words).
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
- **Practice picker:** never use the browser's native `<select>` menu. The trigger is plain text *"Practice 01"* with a chevron; when open it gets a green-tint background. The menu is a white card (12px radius, 1px border, 3px bottom edge, soft shadow), about 340px wide. Each row is at least 44px tall and shows: number (`01`), passage title, topic · time, and on the right the status: a green check for the current practice, the last score (e.g. `6/8`) for finished ones, or a green-tint **New** tag. The selected row has a green-tint background. See `docs/design/05-practice-picker.png`.
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
  - **Pattern card** (mint, 22px radius): a solid green *PATTERN FOUND* badge, the pattern name in large type with a highlighter mark (e.g., *Word **form***), one line of feedback (*"Right word family, wrong job in the sentence."*), a ring showing *2/3 mistakes*, and the **Practice word form →** button with *"6 quick sentences · 2 min"*.
  - **All answers table:** four columns: *Your answer · Correct · Type · What happened*. Mistakes come first, with **You** and **Why** lines. Then a `CORRECT · 5` subheading, where each correct word is shown plainly, the Correct column shows a green check mark, and there is only a **Why** line.
  - **Try this passage again** (retry button).
- **Table rules:** answer words must never break across lines (`white-space: nowrap`); if space is tight, the *What happened* column shrinks instead. Every row, including correct answers, gets its **own** Why line written for that blank (never a generic line like *"Correct form for this sentence."*). The Type tag names the skill that blank tests (from the blank's `errorCategory`), not a guess from the learner's answer.
- There is no separate review page.

**3. Targeted drill (phone reference)**
- Close button, segmented progress (6 steps), `3/6`.
- `WORD FORM PRACTICE` label, the serif sentence, and inline feedback (✓ *Correct* plus an explanation) separated by a thin line. Full-width green **Next** button.

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

### Learner UI implementation notes (2026-09-28)

- The 3:00 timer is advisory: at zero, learners can still finish and submit. Results show actual elapsed time, which can exceed three minutes.
- A session with fewer than two related misses shows no repeated pattern; an all-correct session shows a positive review state.
- The first two screens reuse the current scoring response. Its diagnosis categories and generic Why explanations do not yet implement all of §5. The UI quotes the submitted word for You, displays the server explanation for Why, and uses the real drill count rather than the six-item reference placeholder. Updating diagnosis/content is a separate follow-up; no answer metadata is added to public passage responses.

## 11. Open questions

- Pricing: one-time pass or subscription? At what price per market?
- Free tier: how many passages or sessions before the paywall?
- Where to find the 5 v0.2 test learners in Korea, Japan and Europe?
- Which merchant of record accepts sellers based in China?
