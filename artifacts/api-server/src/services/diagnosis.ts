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
      { id: "t1", prompt: "Seasonal adapta____ helps animals survive the winter.", prefix: "adapta", answer: "tion", hint: "“Seasonal adaptation” names the change that helps the animals survive." },
      { id: "t2", prompt: "The develop____ of new roots takes several weeks.", prefix: "develop", answer: "ment", hint: "“The development of” names a process, so develop becomes development." },
      { id: "t3", prompt: "The discovery has lasting signific____ for the region.", prefix: "signific", answer: "ance", hint: "“Has lasting significance” describes the importance of the discovery." },
      { id: "t4", prompt: "A mix of species improves the resili____ of a forest.", prefix: "resili", answer: "ence", hint: "“The resilience of a forest” means its ability to recover." },
      { id: "t5", prompt: "The team measured the move____ of the glacier.", prefix: "move", answer: "ment", hint: "“The movement of the glacier” names what the team measured." },
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
      { id: "s1", prompt: "Volcanic activ____ increased before the eruption.", prefix: "activ", answer: "ity", hint: "“Volcanic activity” names what increased before the eruption." },
      { id: "s2", prompt: "The differ____ between the samples was small.", prefix: "differ", answer: "ence", hint: "“The difference between” names the contrast being measured." },
      { id: "s3", prompt: "Regular mainten____ keeps the instruments accurate.", prefix: "mainten", answer: "ance", hint: "“Regular maintenance” means the work needed to keep the instruments in good condition." },
      { id: "s4", prompt: "The soil has a high capac____ to hold water.", prefix: "capac", answer: "ity", hint: "“A high capacity” names the amount the soil can hold." },
      { id: "s5", prompt: "The team questioned the accur____ of the estimate.", prefix: "accur", answer: "acy", hint: "“The accuracy of the estimate” means how close it is to the true value." },
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
      { id: "f1", prompt: "The tutor created a suppo____ environment for discussion.", prefix: "suppo", answer: "rtive", hint: "“A supportive environment” describes a place where learners receive help." },
      { id: "f2", prompt: "The participants had to memo____ a short list.", prefix: "memo", answer: "rize", hint: "After “had to,” memorize names the action the participants performed." },
      { id: "f3", prompt: "The study explored the rela____ between sleep and memory.", prefix: "rela", answer: "tionship", hint: "“The relationship between” names the connection being studied." },
      { id: "f4", prompt: "The coast has become incre____ vulnerable to storms.", prefix: "incre", answer: "asingly", hint: "“Increasingly vulnerable” means more vulnerable over time." },
      { id: "f5", prompt: "The new material is remark____ light.", prefix: "remark", answer: "ably", hint: "“Remarkably light” tells us how unusual the material’s lightness is." },
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
      { id: "p1", prompt: "Small earthquakes o____ near the fault each week.", prefix: "o", answer: "ccur", hint: "“Earthquakes occur” means they happen; occur has two c’s and one r." },
      { id: "p2", prompt: "The plants rece____ less light in winter.", prefix: "rece", answer: "ive", hint: "“Receive less light” describes what reaches the plants. Receive is spelled with ei after c." },
      { id: "p3", prompt: "Researchers kept the two samples sepa____.", prefix: "sepa", answer: "rate", hint: "“Kept the samples separate” means they were not mixed. Separate has an a after the p." },
      { id: "p4", prompt: "The enviro____ changes as the lake dries.", prefix: "enviro", answer: "nment", hint: "“The environment” refers to the surrounding conditions; keep the n before ment." },
      { id: "p5", prompt: "The equipment is neces____ for the experiment.", prefix: "neces", answer: "sary", hint: "“Necessary for the experiment” means it is needed. Necessary has one c and two s’s." },
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
      { id: "w1", prompt: "The result depends __ context.", prefix: "", answer: "on", hint: "“Depends on” connects the result to the conditions that affect it." },
      { id: "w2", prompt: "The sample was divided __ two groups.", prefix: "", answer: "into", hint: "“Divided into two groups” tells us how the sample was separated." },
      { id: "w3", prompt: "The theory is useful __ it explains the pattern.", prefix: "", answer: "because", hint: "“Because it explains the pattern” gives the reason the theory is useful." },
      { id: "w4", prompt: "The two samples differ __ size.", prefix: "", answer: "in", hint: "“Differ in size” identifies the feature being compared." },
      { id: "w5", prompt: "Each seed was placed __ a separate container.", prefix: "", answer: "in", hint: "“In a separate container” tells us where each seed was placed." },
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
      { id: "v1", prompt: "The evidence suggest____ a shift.", prefix: "suggest", answer: "s", hint: "“The evidence suggests” takes -s: evidence is treated as one body of information." },
      { id: "v2", prompt: "Researchers have observ____ the pattern.", prefix: "observ", answer: "ed", hint: "“Have observed” describes observations made before now; have is followed by observed." },
      { id: "v3", prompt: "Scientists are study____ the sample.", prefix: "study", answer: "ing", hint: "“Are studying” describes an action in progress." },
      { id: "v4", prompt: "Each plant grow____ toward the light.", prefix: "grow", answer: "s", hint: "“Each plant grows” describes what one plant does, so grow takes -s." },
      { id: "v5", prompt: "The samples were collect____ yesterday.", prefix: "collect", answer: "ed", hint: "“Were collected yesterday” describes a completed action done to the samples." },
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
      { id: "o1", prompt: "The result was highly effect____.", prefix: "effect", answer: "ive", hint: "“Highly effective” describes how well the result worked." },
      { id: "o2", prompt: "The study offers a clear explan____.", prefix: "explan", answer: "ation", hint: "“A clear explanation” names what the study offers." },
      { id: "o3", prompt: "The samples were care____ selected.", prefix: "care", answer: "fully", hint: "“Carefully selected” tells us how the samples were chosen." },
      { id: "o4", prompt: "The change happened grad____ over several years.", prefix: "grad", answer: "ually", hint: "“Happened gradually” tells us how the change unfolded." },
      { id: "o5", prompt: "The method provides reli____ measurements.", prefix: "reli", answer: "able", hint: "“Reliable measurements” describes measurements that can be trusted." },
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
      { id: "a1", prompt: "The finding was highly signif____.", prefix: "signif", answer: "icant", hint: "“Highly significant” describes a finding that matters." },
      { id: "a2", prompt: "The policy had a broad imp____.", prefix: "imp", answer: "act", hint: "“A broad impact” means the policy affected many areas." },
      { id: "a3", prompt: "The results were consis____ across groups.", prefix: "consis", answer: "tent", hint: "“Consistent across groups” means the results agreed rather than varying widely." },
      { id: "a4", prompt: "The data provide evid____ for the theory.", prefix: "evid", answer: "ence", hint: "“Provide evidence” means the data give support for the theory." },
      { id: "a5", prompt: "The study compared two different appro____ to the problem.", prefix: "appro", answer: "aches", hint: "“Two different approaches” means two ways of dealing with the problem." },
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
      { id: "c1", prompt: "The change may lead __ recovery.", prefix: "", answer: "to", hint: "“Lead to recovery” connects the change with its possible result." },
      { id: "c2", prompt: "The pattern occurs __ the climate shifts.", prefix: "", answer: "when", hint: "“When the climate shifts” tells us the circumstances in which the pattern appears." },
      { id: "c3", prompt: "The method is useful __ it is inexpensive.", prefix: "", answer: "because", hint: "“Because it is inexpensive” explains why the method is useful." },
      { id: "c4", prompt: "Without water, the seedlings began to wi____.", prefix: "wi", answer: "lt", hint: "“Without water” explains why the seedlings wilt: they lose their firmness." },
      { id: "c5", prompt: "A thick layer of snow insul____ the soil from cold air.", prefix: "insul", answer: "ates", hint: "“From cold air” is the clue: snow insulates the soil by slowing heat loss." },
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