import type { Blank } from "../data/patternpilot";

export type WeaknessKey =
  | "noun-formation"
  | "suffix-recognition"
  | "word-family"
  | "spelling"
  | "function-words"
  | "verb-inflection"
  | "part-of-speech"
  | "academic-vocabulary"
  | "contextual-prediction";

export type DiagnosisAttempt = {
  blank: Blank;
  submitted: string;
  isCorrect: boolean;
};

export type LearningContent = {
  categoryKey: WeaknessKey;
  label: string;
  detail: string;
  learningTitle: string;
  learningDescription: string;
  objective: string;
  prompts: Array<{
    id: string;
    prompt: string;
    prefix: string;
    answer: string;
    hint: string;
  }>;
};

const content = (entry: LearningContent): LearningContent => entry;

export const learningContentByWeakness: Record<WeaknessKey, LearningContent> = {
  "noun-formation": content({
    categoryKey: "noun-formation",
    label: "Noun formation",
    detail: "You recognize the stem, but the sentence often needs a noun form.",
    learningTitle: "Notice when the sentence needs a noun",
    learningDescription: "Academic passages often turn a familiar verb or adjective into a noun with -tion, -ment, -ity, -ance, or -ence.",
    objective: "Use the words around the blank to identify a noun-forming ending.",
    prompts: [
      { id: "t1", prompt: "adapt → adapta____", prefix: "adapta", answer: "tion", hint: "A process or result often ends in -tion." },
      { id: "t2", prompt: "develop → develop____", prefix: "develop", answer: "ment", hint: "A result or state can use -ment." },
      { id: "t3", prompt: "signify → signific____", prefix: "signific", answer: "ance", hint: "The quality or meaning of something can end in -ance." },
      { id: "t4", prompt: "resilient → resili____", prefix: "resili", answer: "ence", hint: "The noun form of resilient ends in -ence." },
    ],
  }),
  "suffix-recognition": content({
    categoryKey: "suffix-recognition",
    label: "Suffix recognition",
    detail: "The stem is familiar, but the ending is carrying the grammatical signal.",
    learningTitle: "Let the ending carry information",
    learningDescription: "Suffixes can reveal whether a word is acting as a noun, adjective, adverb, or verb before you finish reading the line.",
    objective: "Use the sentence role to choose the smallest correct ending.",
    prompts: [
      { id: "s1", prompt: "active → activ____", prefix: "activ", answer: "ity", hint: "The state or quality of being active uses -ity." },
      { id: "s2", prompt: "different → differ____", prefix: "differ", answer: "ence", hint: "The noun form of different ends in -ence." },
      { id: "s3", prompt: "maintain → mainten____", prefix: "mainten", answer: "ance", hint: "The noun for keeping something in good condition ends in -ance." },
    ],
  }),
  "word-family": content({
    categoryKey: "word-family",
    label: "Word family",
    detail: "You know the root, but the sentence asks for a related form.",
    learningTitle: "Move between related forms",
    learningDescription: "TOEFL blanks often keep the root visible while changing its job in the sentence.",
    objective: "Check the part of speech before choosing a word-family ending.",
    prompts: [
      { id: "f1", prompt: "support → suppo____", prefix: "suppo", answer: "rtive", hint: "An adjective describing help ends in -rtive." },
      { id: "f2", prompt: "memory → memo____", prefix: "memo", answer: "rize", hint: "The verb form ends in -rize." },
      { id: "f3", prompt: "relate → rela____", prefix: "rela", answer: "tionship", hint: "A connection between people is a relationship." },
      { id: "f4", prompt: "increase → incre____", prefix: "incre", answer: "asingly", hint: "The adverb form ends in -asingly." },
    ],
  }),
  spelling: content({
    categoryKey: "spelling",
    label: "Spelling",
    detail: "Your meaning is often close; letter sequences and doubled consonants need more attention.",
    learningTitle: "Slow down around letter patterns",
    learningDescription: "When you know the word but miss the letters, use the visible prefix and sound pattern to check doubles, vowels, and common endings.",
    objective: "Build a reliable letter-by-letter check before you submit.",
    prompts: [
      { id: "p1", prompt: "occur → o____", prefix: "o", answer: "ccur", hint: "This word doubles its first consonant." },
      { id: "p2", prompt: "receive → rece____", prefix: "rece", answer: "ive", hint: "Think i-before-e except after c." },
      { id: "p3", prompt: "separate → sepa____", prefix: "sepa", answer: "rate", hint: "The middle vowel is an a." },
      { id: "p4", prompt: "environment → enviro____", prefix: "enviro", answer: "nment", hint: "The ending is -nment." },
    ],
  }),
  "function-words": content({
    categoryKey: "function-words",
    label: "Function words",
    detail: "Small connecting words are easy to skip when the passage is moving quickly.",
    learningTitle: "Give small words a job",
    learningDescription: "Articles, prepositions, conjunctions, and pronouns are short, but they carry the sentence structure that makes academic writing precise.",
    objective: "Read the grammar around a short blank before reaching for vocabulary.",
    prompts: [
      { id: "w1", prompt: "The result depends __ context.", prefix: "", answer: "on", hint: "This verb takes the preposition on." },
      { id: "w2", prompt: "The sample was divided __ two groups.", prefix: "", answer: "into", hint: "Use into for movement or separation." },
      { id: "w3", prompt: "The theory is useful __ it explains the pattern.", prefix: "", answer: "because", hint: "The second clause gives a reason." },
    ],
  }),
  "verb-inflection": content({
    categoryKey: "verb-inflection",
    label: "Verb inflection",
    detail: "The sentence is guiding you toward a specific tense or inflected form.",
    learningTitle: "Read the time and subject clues",
    learningDescription: "Auxiliary verbs, time markers, and singular subjects tell you which ending or participle belongs in the blank.",
    objective: "Use the subject and helper verb to lock the verb form.",
    prompts: [
      { id: "v1", prompt: "The evidence suggest____ a shift.", prefix: "suggest", answer: "s", hint: "A singular subject takes the third-person ending." },
      { id: "v2", prompt: "Researchers have observ____ the pattern.", prefix: "observ", answer: "ed", hint: "Use the past participle after have." },
      { id: "v3", prompt: "Scientists are study____ the sample.", prefix: "study", answer: "ing", hint: "Use -ing after are." },
    ],
  }),
  "part-of-speech": content({
    categoryKey: "part-of-speech",
    label: "Part of speech",
    detail: "The root is familiar, but the sentence role changes the form you need.",
    learningTitle: "Name the job before the word",
    learningDescription: "Look at what the blank modifies or follows: nouns name, verbs act, adjectives describe, and adverbs qualify.",
    objective: "Identify the blank's grammatical role before completing the word.",
    prompts: [
      { id: "o1", prompt: "The result was highly effect____.", prefix: "effect", answer: "ive", hint: "The blank describes the result, so use an adjective." },
      { id: "o2", prompt: "The study offers a clear explan____.", prefix: "explan", answer: "ation", hint: "The article a signals a noun." },
      { id: "o3", prompt: "The samples were care____ selected.", prefix: "care", answer: "fully", hint: "The blank describes how the action happened." },
    ],
  }),
  "academic-vocabulary": content({
    categoryKey: "academic-vocabulary",
    label: "Academic vocabulary",
    detail: "A few high-frequency academic words are still taking extra time to retrieve.",
    learningTitle: "Build faster academic retrieval",
    learningDescription: "The goal is not to memorize isolated words; connect each word to a topic, a sentence role, and a close word-family partner.",
    objective: "Use context and word families to retrieve academic vocabulary faster.",
    prompts: [
      { id: "a1", prompt: "The finding was highly signif____.", prefix: "signif", answer: "icant", hint: "The adjective means important or meaningful." },
      { id: "a2", prompt: "The policy had a broad imp____.", prefix: "imp", answer: "act", hint: "The noun means an effect or consequence." },
      { id: "a3", prompt: "The results were consis____ across groups.", prefix: "consis", answer: "tent", hint: "The adjective means stable or matching." },
    ],
  }),
  "contextual-prediction": content({
    categoryKey: "contextual-prediction",
    label: "Contextual prediction",
    detail: "Use nearby words and grammar to narrow down the form before you type.",
    learningTitle: "Let the sentence narrow the choice",
    learningDescription: "A blank is never isolated. Read the clause, locate the signal word, and predict the part of speech before checking the letters.",
    objective: "Combine sentence meaning and grammar before completing the visible stem.",
    prompts: [
      { id: "c1", prompt: "The change may lead __ recovery.", prefix: "", answer: "to", hint: "Lead takes to before a result." },
      { id: "c2", prompt: "The pattern occurs __ the climate shifts.", prefix: "", answer: "when", hint: "The second clause gives a time condition." },
      { id: "c3", prompt: "The method is useful __ it is inexpensive.", prefix: "", answer: "because", hint: "The second clause explains why." },
    ],
  }),
};

const categoryAliases: Record<string, WeaknessKey[]> = {
  "word formation": ["noun-formation", "suffix-recognition"],
  "noun ending": ["noun-formation", "suffix-recognition"],
  "adjective ending": ["part-of-speech", "suffix-recognition"],
  "word family": ["word-family", "part-of-speech"],
  spelling: ["spelling"],
  "verb tense / inflection": ["verb-inflection"],
  inflection: ["verb-inflection"],
  plural: ["part-of-speech", "suffix-recognition"],
  "contextual prediction": ["contextual-prediction"],
  vocabulary: ["academic-vocabulary", "contextual-prediction"],
};

const tagAliases: Record<string, WeaknessKey[]> = {
  "academic vocabulary": ["academic-vocabulary"],
  "noun endings": ["noun-formation", "suffix-recognition"],
  "adjective endings": ["part-of-speech", "suffix-recognition"],
  "word family": ["word-family"],
  spelling: ["spelling"],
  context: ["contextual-prediction"],
  inflection: ["verb-inflection"],
  plural: ["part-of-speech"],
};

export type RankedWeakness = {
  key: WeaknessKey;
  label: string;
  count: number;
  score: number;
  detail: string;
  evidence: string[];
  learningTitle: string;
  learningDescription: string;
  drillCount: number;
};

export function diagnoseAttempts(attempts: DiagnosisAttempt[]): RankedWeakness[] {
  const scores = new Map<WeaknessKey, { score: number; blankIds: Set<string>; evidence: string[] }>();
  const contribute = (key: WeaknessKey, weight: number, attempt: DiagnosisAttempt) => {
    const current = scores.get(key) ?? { score: 0, blankIds: new Set<string>(), evidence: [] };
    current.score += weight;
    current.blankIds.add(attempt.blank.id);
    const evidence = `${attempt.blank.fullWord}${attempt.blank.suffix ? ` · ${attempt.blank.suffix}` : ""}`;
    if (!current.evidence.includes(evidence)) current.evidence.push(evidence);
    scores.set(key, current);
  };

  for (const attempt of attempts) {
    if (attempt.isCorrect) continue;
    const categoryKeys = categoryAliases[attempt.blank.errorCategory] ?? ["academic-vocabulary"];
    categoryKeys.forEach((key, index) => contribute(key, index === 0 ? 3 : 1, attempt));
    for (const tag of attempt.blank.tags) {
      for (const key of tagAliases[tag] ?? []) contribute(key, 1, attempt);
    }
  }

  return [...scores.entries()]
    .map(([key, score]) => {
      const learning = learningContentByWeakness[key];
      return {
        key,
        label: learning.label,
        count: score.blankIds.size,
        score: score.score,
        detail: learning.detail,
        evidence: score.evidence.slice(0, 4),
        learningTitle: learning.learningTitle,
        learningDescription: learning.learningDescription,
        drillCount: learning.prompts.length,
      };
    })
    .sort((a, b) => b.score - a.score || b.count - a.count);
}

export function getLearningContent(key: string | undefined): LearningContent {
  return learningContentByWeakness[(key as WeaknessKey) ?? "noun-formation"] ?? learningContentByWeakness["noun-formation"];
}

/** Map internal learning content onto the OpenAPI TrainingSet shape expected by clients. */
export function toTrainingSet(content: LearningContent) {
  return {
    categoryKey: content.categoryKey,
    title: content.learningTitle,
    description: content.learningDescription,
    objective: content.objective,
    prompts: content.prompts.map(({ id, prompt, prefix, answer }) => ({
      id,
      // Spelling drills previously repeated the completed word before the arrow.
      prompt: prompt.split(" → ")[0].trim().toLowerCase() === (prefix + answer).toLowerCase()
        ? prompt.split(" → ").slice(1).join(" → ")
        : prompt,
      prefix,
      missingLength: answer.length,
    })),
  };
}