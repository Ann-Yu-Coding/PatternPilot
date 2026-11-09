# Complete the Words: construction and answer patterns

Research note, 2026-11-09. This is reference material for writing passages, drills and diagnosis copy. It is **not** a product decision; see §6 for decisions this could inform.

## Source and scope

- This note is based on an analysis of a **local, unpublished collection** of 114 third-party "complete the words" practice passages (1,140 blanks). The collection is **not in this repository**.
- To avoid republishing that material, this note gives **only aggregate rules and counts**. It contains no passage text, titles or answer lists from the collection. **Every example below was written for this note.**
- The collection is TOEFL-*style*. Nothing shows the items are official, so its frequencies describe that collection only, not the real exam.
- The full local report (with source citations and a data-issue list) is kept outside git at `outputs/toefl_pattern_analysis.md`.

**Notation:** in `riv[ers]`, `riv` is the visible prefix and `ers` is the hidden part the learner types. Words without brackets are intact context.

---

## 1. How items are built (blank placement)

| Rule | Observed in the collection |
|---|---|
| The first sentence is never blanked | 114/114 passages |
| The last sentence is not blanked | 109/114 |
| Exactly 10 blanks per passage | 114/114 |
| Blanked sentences are consecutive | 114/114 |
| Blanks start in sentence 2 | 86 (sentence 3: 27, sentence 4: 1) |
| Number of sentences containing blanks | 2: 75 · 1: 34 · 3: 5 |
| Intact sentences after the last blank | 1–2 in 98 passages |
| Passage length | 4–5 sentences in 94 passages (range 3–7) |

**Rhythm: every other word.**
- Of 1,026 gaps between consecutive blanks, **96.9% leave exactly one word intact**.
- The run usually starts at the 2nd word of its sentence (often *These/This* + blank).
- It continues across sentence boundaries; 35 blanks are the first word of a sentence.
- It stops after the 10th blank, even in mid-sentence.

**Never blanked, and skipped without breaking the rhythm:**
- **one-letter words** (*a*): these are why every article answer is *the*
- **proper nouns**: one exception, *Earth*, was blanked twice
- **numbers** and **hyphenated words**: no answer contains a digit or a hyphen
- About 1% of gaps look like hand-made exceptions to the rhythm.

**Word cut:**
- In 98.9% of blanks the prefix is the first ⌊n/2⌋ letters of an n-letter word, so the hidden part is the same length as the prefix or one letter longer.
- The 1.1% that deviate are mostly compounds cut at the morpheme boundary.
- Every blanked word has at least 2 letters.

**Typical shape:**
1. An intact topic sentence.
2. 1–2 blanked sentences that elaborate it with a definition, mechanism or examples.
3. 1–2 intact closing sentences about significance.

Example written for this note, following the rules:

> Coral reefs cover less than one percent of the ocean floor. However, th[ey] support ab[out] a quarter o[f] all mar[ine] species.

This shows blank, word, blank, then *a* skipped, then word, blank, word, blank, word.

## 2. What the answers are (aggregate counts)

| Measure | Value |
|---|---|
| Distinct answers (case-insensitive) | 736 of 1,140 blanks; 78% of answer types occur only once |
| Function words (closed-class list) | 25.4% of blanks |
| *and / the / to / of* together | 10.7% of blanks |
| One-letter gaps | 8.1%, always a two-letter word (*to, of, on, in, as, by, or, it, is, up…*) |
| Plural nouns | ≈19% |
| Third-person -s verbs | 30 blanks |
| -ing / -ed endings | 64 / 66 blanks |
| -tion/-sion · -al adjectives · person nouns (-ist/-er/-ian) | ≈54 · ≈49 · ≈27 |
| Hidden-part length | 1: 92 · 2: 248 · 3: 232 · 4: 261 · 5: 200 · 6+: 107 |

**Frames that recur.**
- Example markers: *such as* (14 blanks), *like* (8), *including* (5).
- Lists joined by a blanked *and* (44 passages).
- Preposition collocations: *rely on, based on, focus on, role in, access to, lead to, due to, contribute to, derived from, caused by*.

**Vocabulary.** The content words that repeat across topics are general academic words (*social, patterns, communities, complex, structures, resources, significant, influence, techniques, strategies, essential*), not topic terms.

## 3. Solving clues

- **Length check:** `riv` + 3 hidden letters gives *rivers*. *river* would be shown as `ri` + 3, because the prefix is always half the word.
- **The count separates** singular from plural, base form from -ed/-ing, and adjective from noun.
- **The count rarely separates function words** (`o_` = *of / on / or*), so syntax decides those.
- **Common ambiguous frames:**
  - `a__` → *and / are / any*
  - `th__` → *that / they / this / than*
  - `li__` → *like / life*
  - `mo__` → *most / more*
  - `wh___` → *which / while / where*
- **The word before the blank sets the form:**
  - determiner → noun; *These* → plural
  - *be* → -ing or past participle; *have* → past participle
  - modal → base verb; infinitive *to* → base verb
  - preposition → noun or -ing
  - list partner → the same form as the partner

## 4. Pattern guide

All examples were written for this note.

| Pattern | Recognition clue | Example | Common mistake | §5 label if missed |
|---|---|---|---|---|
| *and* in lists | comma list, `a__` | salt, su[gar], a[nd] flour | *are* | Context / meaning |
| *the* | `t__` before a noun phrase | t[he] growth o[f] cities | *to* | Context / meaning |
| *to*: infinitive vs. preposition | *helps/ability* + to + verb; *led/due/access* + to + noun | helps farmers t[o] protect · led t[o] the loss | verb after prepositional *to* | Grammar ending |
| *of / on / or* | noun + of; *depend/rely* + on; alternatives | depends o[n] rainfall · wind o[r] rain | always *of* | Context / meaning |
| Plural -s | *These/many/several*; count one letter longer | These habi[tats] | dropping -s | Grammar ending |
| 3rd-person -s across an *of*-phrase | true subject is singular | The number of species decl[ines] | *decline* | Grammar ending |
| Example markers | general noun, then specific items | predators su[ch] as owls | *sure* | Word retrieval |
| *By* / preposition + -ing | preposition before a verb slot | By trac[king] the birds | *tracked* | Grammar ending |
| Passive / reduced passive | *be* … *by*; noun + ___ + *from* | is cau[sed] by · minerals extr[acted] from | *-ing* | Grammar ending |
| Adjective before a noun | determiner + ___ + noun | regi[onal] markets | noun form | Word form |
| Person noun | subject before *have/can* | biolo[gists] have shown | *biology* | Word form |
| Parallel forms | visible list partner | coll[ects] samples, meas[ures] them, and records | mixed forms | Grammar ending |
| Tense by passage type | dates → past; general science → present | In 1850 the town gr[ew] · water evapo[rates] | present in history narratives | Grammar ending |
| Relative *that* | noun + ___ + verb | a process th[at] takes years | *they* | Context / meaning |
| Cause / contrast signals | result or opposite nearby | A[s] a res[ult] · Des[pite] the cold | *Despite* + clause | Context / meaning |
| -ly adverb | modifies a verb or adjective | grew rap[idly] | adjective form | Word form |
| Spelling changes | y→i, drop -e, doubling | stu[dies] · mak[ing] · sto[pped] | *studys, makeing, stoped* | Spelling |
| Comparative | *than* nearby | war[mer] th[an] | *more warm* | Grammar ending |
| Phrasal verb particle | motion/change verb + particle | the engine br[oke] do[wn] | wrong particle | Context / meaning |

## 5. Priority checklist for learners

1. Read sentence 1 first. Expect blanks on every other word. *a*, names, numbers and hyphenated words are never blanks.
2. Length check: the word is 2 × prefix letters, or one more.
3. Master the two-letter words, and *and / the / to / of*.
4. Copy the form of list partners. Check number (*These* → plural) and the true subject.
5. Learn the example frames and preposition collocations.
6. After a preposition use -ing. After *be … by* use a past participle. Between a determiner and a noun use an adjective.
7. Then: person nouns, tense by passage type, relative *that*, logic signals, spelling changes.

## 6. Possible uses in PatternPilot (needs a product decision)

These are options, not decisions. Record any adopted choice in `docs/product.md` §10.

- **Passage authoring:** original passages could follow §1:
  - an intact first and last sentence
  - an every-other-word rhythm
  - no blanks on *a*, names, numbers or hyphenated words
  - prefix = ⌊n/2⌋

  The current seed passages use 8 blanks; this collection uses 10.
- **Diagnosis copy:** §4's clue column gives concrete signals of the kind §5 of product.md asks for (e.g., "after *These*, look for the plural -s").
- **Drill selection:** the most frequent targets were function words, plural -s, -ing/-ed and list parallelism.
