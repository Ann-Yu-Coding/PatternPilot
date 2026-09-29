import words from "../data/english/words.json";
import type { Blank } from "../data/patternpilot";

export type MissCategory =
  | "Grammar ending"
  | "Word form"
  | "Spelling"
  | "Word retrieval"
  | "Context / meaning";
const dictionary = new Set([...words, "a", "i"]);
export const isEnglishWord = (word: string) =>
  dictionary.has(word.toLowerCase());
const normalize = (value: string) => value.trim().toLowerCase();
type Pos = "noun" | "verb" | "adjective" | "adverb";

// Small, explicit POS families complement the spelling-only dictionary. Entries are
// base forms; inflections are generated below. A word may have more than one role.
const families: Array<Partial<Record<Pos, string>>> = [
  {
    verb: "depend",
    adjective: "independent dependent",
    noun: "independence dependence",
    adverb: "independently dependently",
  },
  { verb: "exchange", noun: "exchange", adjective: "exchangeable" },
  {
    verb: "support",
    noun: "support supporter",
    adjective: "supportive",
    adverb: "supportively",
  },
  { noun: "resilience", adjective: "resilient", adverb: "resiliently" },
  { verb: "recover", noun: "recovery", adjective: "recoverable" },
  { verb: "study", noun: "study" },
  { verb: "grow", noun: "growth" },
  { verb: "survive", noun: "survival survivor" },
  { verb: "record", noun: "record recording" },
  { verb: "recall", noun: "recall recollection" },
  {
    verb: "generalize",
    adjective: "general",
    noun: "generality",
    adverb: "generally",
  },
  { adjective: "flexible", noun: "flexibility", adverb: "flexibly" },
  { adjective: "vulnerable", noun: "vulnerability", adverb: "vulnerably" },
  { verb: "consolidate", noun: "consolidation" },
  {
    verb: "disrupt",
    noun: "disruption",
    adjective: "disruptive",
    adverb: "disruptively",
  },
  { noun: "evidence", adjective: "evident", adverb: "evidently" },
  {
    verb: "organize",
    noun: "organization organizer",
    adjective: "organizational",
  },
  { noun: "hierarchy", adjective: "hierarchical", adverb: "hierarchically" },
  { verb: "relate", noun: "relation relationship", adjective: "relational" },
  {
    verb: "care",
    noun: "care",
    adjective: "careful careless",
    adverb: "carefully carelessly",
  },
  {
    verb: "increase",
    noun: "increase",
    adjective: "increasing",
    adverb: "increasingly",
  },
  { verb: "excavate", noun: "excavation excavator" },
  {
    verb: "interpret",
    noun: "interpretation interpreter",
    adjective: "interpretive",
  },
  {
    verb: "suggest",
    noun: "suggestion",
    adjective: "suggestive",
    adverb: "suggestively",
  },
  { adjective: "large", adverb: "largely", noun: "largeness" },
];

function inflections(base: string, pos: string): Set<string> {
  const forms = new Set([base]);
  if (pos === "noun" || pos === "verb") {
    forms.add(
      /[^aeiou]y$/.test(base)
        ? base.slice(0, -1) + "ies"
        : /(?:s|x|z|ch|sh)$/.test(base)
          ? base + "es"
          : base + "s",
    );
  }
  if (pos === "verb") {
    // Retaining the base and attaching a known verbal ending still signals an
    // inflection choice (studyed), before spelling is considered.
    for (const ending of ["s", "es", "ed", "ing"]) forms.add(base + ending);
    forms.add(
      /[^aeiou]y$/.test(base)
        ? base.slice(0, -1) + "ied"
        : base.endsWith("e")
          ? base + "d"
          : base + "ed",
    );
    forms.add(
      base.endsWith("ie")
        ? base.slice(0, -2) + "ying"
        : /[^e]e$/.test(base)
          ? base.slice(0, -1) + "ing"
          : base + "ing",
    );
    // Doubled-consonant variants are accepted only when present in the dictionary.
    for (const ending of ["ed", "ing"]) {
      const doubled = base + base.slice(-1) + ending;
      if (isEnglishWord(doubled)) forms.add(doubled);
    }
  }
  if (pos === "adjective") {
    for (const ending of ["er", "est"]) {
      const form = /[^aeiou]y$/.test(base)
        ? base.slice(0, -1) + "i" + ending
        : base.endsWith("e")
          ? base + ending.slice(1)
          : base + ending;
      if (isEnglishWord(form)) forms.add(form);
      const doubled = base + base.slice(-1) + ending;
      if (isEnglishWord(doubled)) forms.add(doubled);
    }
  }
  return forms;
}
const lexicalFamilies = families.map((family) =>
  Object.entries(family).flatMap(([pos, entries]) =>
    entries!
      .split(" ")
      .map((base) => ({ base, pos, forms: inflections(base, pos) })),
  ),
);
const endings: Array<[string, Pos[]]> = [
  ["ization", ["noun"]],
  ["ation", ["noun"]],
  ["tion", ["noun"]],
  ["sion", ["noun"]],
  ["ment", ["noun"]],
  ["ness", ["noun"]],
  ["ity", ["noun"]],
  ["ence", ["noun"]],
  ["ance", ["noun"]],
  ["ship", ["noun"]],
  ["al", ["noun", "adjective"]],
  ["er", ["noun", "adjective"]],
  ["or", ["noun"]],
  ["ful", ["adjective"]],
  ["less", ["adjective"]],
  ["able", ["adjective"]],
  ["ible", ["adjective"]],
  ["ive", ["adjective"]],
  ["ous", ["adjective"]],
  ["ent", ["adjective"]],
  ["ant", ["adjective"]],
  ["ly", ["adverb"]],
  ["ize", ["verb"]],
  ["ing", ["verb", "noun"]],
  ["ed", ["verb"]],
  ["es", ["verb", "noun"]],
  ["s", ["verb", "noun"]],
];
function guessedRoles(word: string): Pos[] {
  return endings.find(([ending]) => word.endsWith(ending))?.[1] || [];
}
function stems(word: string): string[] {
  return [
    word,
    ...(word.endsWith("e") ? [word.slice(0, -1)] : []),
    ...(word.endsWith("y") ? [word.slice(0, -1) + "i"] : []),
  ].filter((s) => s.length >= 3);
}

/** Standard Levenshtein distance (a transposition counts as two edits). */
export function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(
        row[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + Number(a[i - 1] !== b[j - 1]),
      );
    previous = row;
  }
  return previous[b.length];
}

/** submitted is the missing suffix, never a second copy of the full word. */
export function classifyAnswer(
  blank: Blank,
  submitted: string,
): MissCategory | null {
  const suffix = normalize(submitted);
  const correct = normalize(blank.fullWord);
  const candidate = normalize(blank.prefix) + suffix;
  if (candidate === correct) return null;
  if (!suffix) return "Word retrieval";

  const pos = normalize(blank.partOfSpeech);
  const family = lexicalFamilies.find((entries) =>
    entries.some((e) => e.pos === pos && e.forms.has(correct)),
  );
  const sameRole =
    family?.filter((e) => e.pos === pos && e.forms.has(correct)) || [];
  // Do not confuse a derivational source lemma (consolidate → consolidation)
  // with the inflection base of the actual answer word (consolidation).
  const bases = sameRole.length
    ? sameRole.map((e) => e.base)
    : [
        correct,
        ...(inflections(normalize(blank.lemma), pos).has(correct)
          ? [normalize(blank.lemma)]
          : []),
      ];
  if (bases.some((base) => inflections(base, pos).has(candidate)))
    return "Grammar ending";

  const roles =
    family?.filter((e) => e.forms.has(candidate)).map((e) => e.pos) || [];
  if (roles.length && !roles.includes(pos)) return "Word form";
  const real = isEnglishWord(candidate);
  const familyWords = normalize(blank.wordFamily).split(/\s+/);
  if (
    !family &&
    familyWords.includes(candidate) &&
    guessedRoles(candidate).length > 0 &&
    !guessedRoles(candidate).some((role) => role === pos)
  )
    return "Word form";

  // Ending-aware matching requires an exact known stem, not a shared prefix or
  // edit distance. Thus resilence is a spelling slip, not a guessed word form.
  if (!real) {
    const roots = new Set(
      [
        blank.root,
        blank.lemma,
        ...bases,
        ...(family?.map((e) => e.base) || []),
      ].flatMap((word) => stems(normalize(word))),
    );
    const suffixParts = normalize(blank.suffix).split("+");
    const ending = suffixParts.join("");
    if (ending && correct.endsWith(ending))
      for (const stem of stems(correct.slice(0, -ending.length)))
        roots.add(stem);
    if (
      [...roots].some((stem) =>
        endings.some(
          ([ending, endingRoles]) =>
            candidate === stem + ending &&
            !endingRoles.some((role) => role === pos),
        ),
      )
    )
      return "Word form";
  }
  const missing = normalize(blank.answer);
  const spellingLimit = missing.length <= 4 ? 1 : 2;
  if (
    !real &&
    Math.abs(suffix.length - missing.length) <= spellingLimit &&
    editDistance(suffix, missing) <= spellingLimit
  )
    return "Spelling";
  if (real) return "Context / meaning";
  return "Word retrieval";
}
