import { randomUUID } from "node:crypto";

export type Blank = {
  id: string;
  order: number;
  prefix: string;
  missingLength: number;
  fullWord: string;
  answer: string;
  lemma: string;
  partOfSpeech: string;
  wordFamily: string;
  root: string;
  suffix: string;
  errorCategory: string;
  tags: string[];
};

export type PracticeSet = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  estimatedMinutes: number;
  blankCount: number;
  passage: string;
  blanks: Blank[];
  published: boolean;
  sourceLabel: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  setIds: string[];
  startedAt: string;
  weaknessKey?: string;
};

/** Globally unique blank id: `{setId}__{localKey}` (e.g. set-ecology__b1). */
export function makeBlankId(setId: string, localKey: string): string {
  const normalizedLocal = localKey.includes("__") ? localKey.split("__").pop()! : localKey;
  return `${setId}__${normalizedLocal}`;
}

export function blankToken(blankId: string): string {
  return `{{${blankId}}}`;
}

const blank = (
  setId: string,
  localKey: string,
  order: number,
  prefix: string,
  fullWord: string,
  suffix: string,
  errorCategory: string,
  wordFamily: string,
  tags: string[],
): Blank => ({
  id: makeBlankId(setId, localKey),
  order,
  prefix,
  missingLength: fullWord.length - prefix.length,
  fullWord,
  answer: fullWord.slice(prefix.length),
  lemma: fullWord.replace(/(s|ed|ing|tion|ment|ity)$/, ""),
  partOfSpeech: suffix.match(/(tion|ment|ity|ance|ence)$/) ? "noun" : "verb",
  wordFamily,
  root: wordFamily.split(" ")[0].toLowerCase(),
  suffix,
  errorCategory,
  tags,
});

const t = (setId: string, localKey: string) => blankToken(makeBlankId(setId, localKey));

/** Ensure blank ids are unique to a set and rewrite {{local}} / {{legacy}} tokens in the passage. */
export function bindBlanksToSet(
  setId: string,
  passage: string,
  blanks: Blank[],
): { passage: string; blanks: Blank[] } {
  const remapped = blanks.map((item, index) => {
    const localKey = item.id.includes("__")
      ? item.id.split("__").pop()!
      : item.id || `b${index + 1}`;
    return { ...item, id: makeBlankId(setId, localKey) };
  });

  let nextPassage = passage;
  for (const item of remapped) {
    const localKey = item.id.split("__").pop()!;
    nextPassage = nextPassage.replaceAll(`{{${localKey}}}`, blankToken(item.id));
  }

  return { passage: nextPassage, blanks: remapped };
}

export const practiceSets: PracticeSet[] = [
  {
    id: "set-ecology",
    title: "How forests communicate",
    topic: "Environmental science",
    difficulty: "Core",
    estimatedMinutes: 7,
    blankCount: 8,
    published: true,
    sourceLabel: "PatternPilot original",
    updatedAt: "2026-09-22",
    passage:
      `For decades, forests were treated as collections of indep${t("set-ecology", "b1")} trees. Recent research, however, suggests that underground fungal networks allow trees to exch${t("set-ecology", "b2")} resources. Older trees can supp${t("set-ecology", "b3")} younger plants by transferring carbon when sunlight is limited. This hidden system increases the resi${t("set-ecology", "b4")} of an ecosystem and may help it rec${t("set-ecology", "b5")} after drought. Scientists are now study${t("set-ecology", "b6")} how these connections influence the grow${t("set-ecology", "b7")} and survi${t("set-ecology", "b8")} of entire forests.`,
    blanks: [
      blank("set-ecology", "b1", 1, "indep", "independent", "ent", "word formation", "independent independence", ["academic vocabulary", "adjective endings"]),
      blank("set-ecology", "b2", 2, "exch", "exchange", "ange", "spelling", "exchange exchangeable", ["spelling"]),
      blank("set-ecology", "b3", 3, "supp", "support", "ort", "word family", "support supportive", ["word family"]),
      blank("set-ecology", "b4", 4, "resi", "resilience", "lience", "word formation", "resilient resilience", ["academic vocabulary", "noun endings"]),
      blank("set-ecology", "b5", 5, "rec", "recover", "over", "contextual prediction", "recover recovery", ["context"]),
      blank("set-ecology", "b6", 6, "study", "studying", "ing", "verb tense / inflection", "study studying", ["inflection"]),
      blank("set-ecology", "b7", 7, "grow", "growth", "th", "word formation", "grow growth", ["noun endings"]),
      blank("set-ecology", "b8", 8, "survi", "survival", "val", "word formation", "survive survival", ["noun endings"]),
    ],
  },
  {
    id: "set-memory",
    title: "Why memory changes with age",
    topic: "Psychology",
    difficulty: "Core",
    estimatedMinutes: 7,
    blankCount: 8,
    published: true,
    sourceLabel: "PatternPilot original",
    updatedAt: "2026-09-22",
    passage:
      `Memory is not a fixed recor${t("set-memory", "b1")} of everything a person experiences. Instead, each act of reca${t("set-memory", "b2")} can change the original memory. When people retell an event, they often rely on gene${t("set-memory", "b3")} knowledge to fill missing details. This process makes memories more flex${t("set-memory", "b4")} but also more vuln${t("set-memory", "b5")} to suggestion. Researchers have found that sleep supp${t("set-memory", "b6")} the consol${t("set-memory", "b7")} of new information, while stress can disr${t("set-memory", "b8")} it.`,
    blanks: [
      blank("set-memory", "b1", 1, "recor", "record", "d", "spelling", "record recording", ["spelling"]),
      blank("set-memory", "b2", 2, "reca", "recall", "ll", "word family", "recall recollection", ["word family"]),
      blank("set-memory", "b3", 3, "gene", "general", "ral", "contextual prediction", "general generally", ["context"]),
      blank("set-memory", "b4", 4, "flex", "flexible", "ible", "adjective ending", "flexible flexibility", ["adjective endings"]),
      blank("set-memory", "b5", 5, "vuln", "vulnerable", "erable", "academic vocabulary", "vulnerable vulnerability", ["academic vocabulary"]),
      blank("set-memory", "b6", 6, "supp", "supports", "orts", "verb tense / inflection", "support supportive", ["inflection"]),
      blank("set-memory", "b7", 7, "consol", "consolidation", "idation", "word formation", "consolidate consolidation", ["noun endings"]),
      blank("set-memory", "b8", 8, "disr", "disrupt", "upt", "contextual prediction", "disrupt disruption", ["context"]),
    ],
  },
  {
    id: "set-archaeology",
    title: "Reading the first cities",
    topic: "Archaeology",
    difficulty: "Stretch",
    estimatedMinutes: 8,
    blankCount: 8,
    published: true,
    sourceLabel: "PatternPilot original",
    updatedAt: "2026-09-22",
    passage:
      `Archaeologists use several kinds of evid${t("set-archaeology", "b1")} to reconstruct how early cities were orga${t("set-archaeology", "b2")}. The size of a building may reveal social hier${t("set-archaeology", "b3")}, while traces of grain can indicate trade rela${t("set-archaeology", "b4")}. Because many materials decay, researchers must make care${t("set-archaeology", "b5")} inferences from incomplete records. New imaging methods are incre${t("set-archaeology", "b6")} useful because they allow teams to map sites without exca${t("set-archaeology", "b7")} every layer. This approach protects fragile evidence for future study and inter${t("set-archaeology", "b8")}.`,
    blanks: [
      blank("set-archaeology", "b1", 1, "evid", "evidence", "ence", "noun ending", "evident evidence", ["noun endings"]),
      blank("set-archaeology", "b2", 2, "orga", "organized", "nized", "verb tense / inflection", "organize organization", ["inflection"]),
      blank("set-archaeology", "b3", 3, "hier", "hierarchies", "archies", "plural", "hierarchy hierarchical", ["plural"]),
      blank("set-archaeology", "b4", 4, "rela", "relationships", "tionships", "word formation", "relate relationship", ["noun endings"]),
      blank("set-archaeology", "b5", 5, "care", "careful", "ful", "adjective ending", "care careful", ["adjective endings"]),
      blank("set-archaeology", "b6", 6, "incre", "increasingly", "asingly", "word family", "increase increasingly", ["word family"]),
      blank("set-archaeology", "b7", 7, "exca", "excavating", "vating", "verb tense / inflection", "excavate excavation", ["inflection"]),
      blank("set-archaeology", "b8", 8, "inter", "interpretation", "pretation", "word formation", "interpret interpretation", ["noun endings"]),
    ],
  },
];

export const sessions = new Map<string, Session>();

export const trainingByWeakness: Record<string, {
  title: string;
  description: string;
  prompts: Array<{ id: string; prompt: string; prefix: string; answer: string; hint: string }>;
}> = {
  "word formation": {
    title: "Train the word-building pattern",
    description: "Your answers suggest that the word stem is familiar, but the ending changes when the sentence needs a noun.",
    prompts: [
      { id: "t1", prompt: "adapt → adapta____", prefix: "adapta", answer: "tion", hint: "A process or result often ends in -tion." },
      { id: "t2", prompt: "develop → develop____", prefix: "develop", answer: "ment", hint: "A result or state can use -ment." },
      { id: "t3", prompt: "signify → signific____", prefix: "signific", answer: "ance", hint: "The quality or meaning of something can end in -ance." },
      { id: "t4", prompt: "resilient → resili____", prefix: "resili", answer: "ence", hint: "The noun form of resilient ends in -ence." },
    ],
  },
  spelling: {
    title: "Train the letter pattern",
    description: "You are close on meaning, but a few letter sequences are costing points. Slow down around doubled consonants and vowel pairs.",
    prompts: [
      { id: "t1", prompt: "occur → o____", prefix: "o", answer: "ccur", hint: "This word doubles its first consonant." },
      { id: "t2", prompt: "receive → rece____", prefix: "rece", answer: "ive", hint: "Think i-before-e except after c." },
      { id: "t3", prompt: "separate → sepa____", prefix: "sepa", answer: "rate", hint: "The middle vowel is an a." },
      { id: "t4", prompt: "environment → enviro____", prefix: "enviro", answer: "nment", hint: "The ending is -nment." },
    ],
  },
  "word family": {
    title: "Train the word-family shift",
    description: "You often recognize the root, but the sentence asks for a related form. Watch the part of speech before choosing the ending.",
    prompts: [
      { id: "t1", prompt: "support → suppo____", prefix: "suppo", answer: "rtive", hint: "An adjective describing help ends in -rtive." },
      { id: "t2", prompt: "memory → memo____", prefix: "memo", answer: "rize", hint: "The verb form ends in -rize." },
      { id: "t3", prompt: "relate → rela____", prefix: "rela", answer: "tionship", hint: "A connection between people is a relationship." },
      { id: "t4", prompt: "increase → incre____", prefix: "incre", answer: "asingly", hint: "The adverb form ends in -asingly." },
    ],
  },
};

export const findSet = (id: string) => practiceSets.find((set) => set.id === id);
export const findBlank = (id: string) =>
  practiceSets.flatMap((set) => set.blanks).find((item) => item.id === id);
export const newId = () => randomUUID();

export function allBlankIds(): string[] {
  return practiceSets.flatMap((set) => set.blanks.map((item) => item.id));
}
