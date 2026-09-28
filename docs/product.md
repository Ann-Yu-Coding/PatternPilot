# PatternPilot — Product Source of Truth

This is the single source of truth for product decisions. Every tool (Codex, ChatGPT, Claude) and every contributor reads this before working. **Whenever a decision is made anywhere, update this file.**

Last updated: 2026-09-28

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

_To be filled in from the UI plan made with ChatGPT._

Known so far:
- Move away from the generic "AI SaaS" look of the current prototype.
- Calm, focused and quiet. The product promise is "a quieter kind of prep."
- The diagnosis and next step are the focus of the results screen, more than the score.

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

## 11. Open questions

- Pricing: one-time pass or subscription? At what price per market?
- Free tier: how many passages or sessions before the paywall?
- Where to find the 5 v0.2 test learners in Korea, Japan and Europe?
- Which merchant of record accepts sellers based in China?
