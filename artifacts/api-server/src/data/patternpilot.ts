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
  linguisticPrefix?: string;
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

/** Rebind both local and fully qualified passage tokens without changing blank order. */
export function bindBlanksToSet(setId: string, passage: string, blanks: Blank[]): { passage: string; blanks: Blank[] } {
  const mapping = new Map<string, string>();
  const ids = new Set<string>();
  const remapped = blanks.map((item, index) => {
    const local = item.id?.split("__").pop() || `b${index + 1}`;
    if (!/^[A-Za-z0-9_-]+$/.test(local)) throw new Error("Invalid blank local ID");
    const id = makeBlankId(setId, local);
    if (ids.has(id)) throw new Error("Duplicate blank ID");
    ids.add(id);
    for (const old of [item.id, local]) {
      if (old) {
        if (mapping.has(old) && mapping.get(old) !== id) throw new Error("Ambiguous blank ID");
        mapping.set(old, id);
      }
    }
    return { ...item, id };
  });
  const seen = new Map<string, number>();
  const nextPassage = passage.replace(/\{\{([^{}]+)\}\}/g, (_token, old: string) => {
    const id = mapping.get(old);
    if (!id) throw new Error("Unknown passage blank token");
    seen.set(id, (seen.get(id) ?? 0) + 1);
    return blankToken(id);
  });
  if (nextPassage.replace(/\{\{[^{}]+\}\}/g, "").match(/\{\{|\}\}/)) throw new Error("Malformed passage token");
  for (const id of ids) if (seen.get(id) !== 1) throw new Error("Each blank needs exactly one passage token");
  return { passage: nextPassage, blanks: remapped };
}

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

export const newId = () => randomUUID();
