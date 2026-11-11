import { useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { ProgressPreview } from "./progress-preview";
import { FREE_PASSAGE_LIMIT, MONTHLY_PRICE_USD } from "../lib/product-config";
import "../practice.css";
import "./landing-page.css";

const practiceCopy = "Do a full passage";

function PracticeLink({ className = "" }: { className?: string }) {
  return (
    <Link className={`learner-button ${className}`.trim()} href="/practice">
      {practiceCopy} <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

function SeenDots({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`landing-seen ${compact ? "is-compact" : ""}`}>
      <span aria-hidden="true">
        <i />
        <i />
      </span>
      <small>Pattern threshold reached</small>
    </div>
  );
}

// A real blank from the first seeded passage (set-ecology b4). Learners who
// know "resilient" often write the adjective where the sentence needs a noun.
const DEMO_PREFIX = "resi";
const DEMO_ANSWER = "lience";
const DEMO_WORD = DEMO_PREFIX + DEMO_ANSWER;
const DEMO_WHY = "“Increases the” needs a noun here: resilience.";

function MarkedSentence() {
  return (
    <p className="landing-demo-sentence">
      This hidden system increases the{" "}
      <span className="landing-mistake">
        <del>resilient</del> <ins>{DEMO_WORD}</ins>
      </span>{" "}
      of an ecosystem and may help it recover after drought.
    </p>
  );
}

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = current;
    }
  }
  return row[b.length];
}

// Same word family, wrong part of speech → Word form. Close but not a word →
// Spelling (the §5 rule allows 2 edits when 5+ letters are missing). Anything
// else gets the answer without a label, so the demo never claims a diagnosis
// it can't support.
const wordFormEndings = new Set(["lient", "liently"]);

type TryResult = "correct" | "form" | "spelling" | "other";

function classifyDemo(typed: string): TryResult {
  if (typed === DEMO_ANSWER) return "correct";
  if (wordFormEndings.has(typed)) return "form";
  if (editDistance(typed, DEMO_ANSWER) <= 2) return "spelling";
  return "other";
}

const demoCards: Record<
  "form" | "spelling",
  { first: string; second: string; copy: string }
> = {
  form: {
    first: "Word",
    second: "form",
    copy: "Right word family, wrong job in the sentence.",
  },
  spelling: {
    first: "",
    second: "Spelling",
    copy: "You found the word. A letter or two is off.",
  },
};

function TryOneWord() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<TryResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function check(event: FormEvent) {
    event.preventDefault();
    const typed = value.trim().toLowerCase();
    if (!typed) {
      inputRef.current?.focus();
      return;
    }
    setResult(classifyDemo(typed));
  }

  function reset() {
    setValue("");
    setResult(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const typed = value.trim().toLowerCase();
  const card = result === "form" || result === "spelling" ? demoCards[result] : null;

  return (
    <aside className="landing-hero-preview landing-try" aria-label="Try one word">
      <div className="landing-preview-bar">
        <span>Try one word</span>
        <span>Ecology · harder than it looks</span>
      </div>
      <form className="landing-try-form" onSubmit={check}>
        <p className="landing-try-sentence">
          This hidden system increases the{" "}
          {result === null ? (
            <span className="landing-try-word">
              {DEMO_PREFIX}
              <input
                ref={inputRef}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                maxLength={9}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-label={`Missing letters after ${DEMO_PREFIX}`}
                placeholder="_ _ _ _ _ _"
              />
            </span>
          ) : result === "correct" ? (
            <span className="landing-try-correct">{DEMO_WORD}</span>
          ) : (
            <span className="landing-mistake">
              <del>
                {DEMO_PREFIX}
                {typed}
              </del>{" "}
              <ins>{DEMO_WORD}</ins>
            </span>
          )}{" "}
          of an ecosystem and may help it recover after drought.
        </p>
        {result === null && (
          <div className="landing-try-actions">
            <small>A real blank from our first passage · 6 letters</small>
            <button type="submit" className="learner-button">
              Check
            </button>
          </div>
        )}
      </form>

      {result !== null && (
        <div className="landing-preview-card landing-try-result" aria-live="polite">
          {card ? (
            <>
              <span className="learner-pattern-badge is-possible">
                Possible pattern
              </span>
              <h2>
                {card.first && `${card.first} `}
                <mark>{card.second}</mark>
              </h2>
              <p>{card.copy}</p>
            </>
          ) : (
            <h2 className="landing-try-heading">
              {result === "correct" ? "✓ Correct" : "Not quite"}
            </h2>
          )}
          <p className="landing-try-why">
            <b>Why</b> {DEMO_WHY}
          </p>
          <p className="landing-try-why">
            <b>Rule</b> -ent adjective → -ence noun: resilient → resilience.
          </p>
          <div className="landing-try-next">
            <button type="button" className="learner-button retry" onClick={reset}>
              <RotateCcw size={15} aria-hidden="true" /> Try again
            </button>
            <Link href="/practice" className="landing-try-link">
              Do a full passage →
            </Link>
          </div>
          <small className="landing-try-note">
            A full passage has 8 blanks. Misses that repeat become a pattern
            with a 5-sentence drill.
          </small>
        </div>
      )}
    </aside>
  );
}

function DiagnosisPreview({ compact = false }: { compact?: boolean }) {
  if (compact) return <TryOneWord />;

  return (
    <div className="landing-diagnosis-demo">
      <div className="landing-demo-passage">
        <p className="landing-demo-label">Marked passage · seeded practice</p>
        <MarkedSentence />
        <div className="landing-why">
          <span>Why</span>
          <p>{DEMO_WHY}</p>
        </div>
      </div>

      <section
        className="learner-pattern landing-pattern-card"
        aria-label="Example Word form pattern card"
      >
        <div className="learner-pattern-copy">
          <span className="learner-pattern-badge">Pattern</span>
          <h2>
            Word <mark>form</mark>
          </h2>
          <p>Right word family, wrong job in the sentence.</p>
          <p className="pattern-evidence">
            Pattern rule · 2 similar misses in recent passages
          </p>
          <div className="landing-drill-preview">
            <span>First drill sentence</span>
            <p>
              The finding was highly{" "}
              <span className="landing-nowrap">
                signif
                <span className="landing-slots" aria-label="four missing letters">
                  ____
                </span>
                .
              </span>
            </p>
          </div>
        </div>
        <SeenDots />
      </section>
    </div>
  );
}

const formRules = [
  {
    from: "noun in -ance / -ence",
    to: "adjective in -ant / -ent",
    examples: "significance → significant · independence → independent · abundance → abundant",
    note: "Most -ance/-ence nouns have a matching -ant/-ent adjective.",
  },
  {
    from: "noun in -ity",
    to: "adjective without -ity",
    examples: "scarcity → scarce · complexity → complex · curiosity → curious",
    note: "The adjective sometimes adds -e or -ous back.",
  },
  {
    from: "noun in -tion / -sion",
    to: "verb in -ate / -e, adjective in -tive / -sive",
    examples: "consolidation → consolidate · production → produce, productive · expansion → expand, expansive",
    note: "Check the sentence: does it need an action or a description?",
  },
  {
    from: "field in -ology",
    to: "person in -ologist, adjective in -ological",
    examples: "biology → biologist → biological · geology → geologist → geological",
    note: "“Biolo___ have shown…” needs a person: biologists.",
  },
  {
    from: "noun in -ment",
    to: "adjective in -mental",
    examples: "environment → environmental · development → developmental",
    note: "The verb is usually the noun without -ment: develop.",
  },
  {
    from: "adjective",
    to: "adverb in -ly (-al → -ally, -ic → -ically)",
    examples: "rapid → rapidly · environmental → environmentally · dramatic → dramatically",
    note: "Use the adverb when the word describes a verb or another adjective.",
  },
];

const learnerExamples = [
  {
    place: "A grad-school applicant in Seoul",
    situation:
      "Reads academic passages well, but loses points on word endings.",
    pattern: "Grammar ending",
    practice:
      "Use subjects, helper verbs, and time clues to choose the ending.",
  },
  {
    place: "A study-abroad student in Tokyo",
    situation: "Runs out of time and leaves some word blanks unfinished.",
    pattern: "Skipped / time pressure",
    practice:
      "Read the sentence signal first, then retrieve the missing letters faster.",
  },
  {
    place: "A learner in Europe moving from IELTS",
    situation:
      "Understands the passage, but is new to TOEFL’s Complete the Words format.",
    pattern: "Word form",
    practice:
      "Notice whether the sentence needs a noun, verb, adjective, or adverb.",
  },
];

function HowVisual({ step }: { step: number }) {
  if (step === 1) {
    return (
      <div className="landing-how-visual landing-how-read" aria-hidden="true">
        <span>It increases the resi</span>
        <b>_ _ _ _ _ _</b>
        <span> of an ecosystem.</span>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="landing-how-visual landing-how-review" aria-hidden="true">
        <span>
          <del>resilient</del> <ins>resilience</ins>
        </span>
        <small>Why · “Increases the” needs a noun here: resilience.</small>
      </div>
    );
  }
  return (
    <div className="landing-how-visual landing-how-pattern" aria-hidden="true">
      <span>Word form</span>
      <i />
      <i />
      <small>5 focused sentences</small>
    </div>
  );
}

const faqs = [
  [
    "Is it free?",
    `Yes. ${FREE_PASSAGE_LIMIT} passages are free, including retries and their targeted drills.`,
  ],
  ["Do I need an account?", "No. You can start practising without signing up."],
  [
    "Where is my data stored?",
    "Your practice history stays in this browser. If you join the waitlist, your email is stored in our database.",
  ],
  [
    "Is this the official TOEFL?",
    "No. Pattern Study uses original practice passages and is not affiliated with or endorsed by ETS.",
  ],
  [
    "Which devices work?",
    "Pattern Study is designed phone-first and also works in current tablet and desktop browsers. Your history stays with the browser and device you used.",
  ],
];

export function LandingPage() {
  return (
    <div className="learner-page landing-page">
      <header className="learner-nav landing-nav">
        <Link href="/" className="learner-brand">
          pattern study
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/practice">Practice</Link>
          <Link href="/dashboard">Progress</Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="learner-eyebrow">
              TOEFL Reading · Complete the Words
            </p>
            <h1>
              Still losing points on{" "}
              <span className="landing-scribble">Complete the Words?</span>
            </h1>
            <p className="landing-lede">
              You’ve memorised word lists and read hard articles, yet the blanks
              still cost you points. Usually it’s one of two traps: a topic
              you rarely read about, or a word you know in one form but not
              another. Pattern Study shows which trap is yours, and how to fix
              it.
            </p>
            <a className="landing-hero-next" href="#traps-heading">
              Why the blanks cost you points ↓
            </a>
            <p className="landing-note landing-margin-note">
              No account needed. Your practice history stays in this browser.
            </p>
          </div>
          <DiagnosisPreview compact />
        </section>

        <section
          className="landing-section landing-traps"
          aria-labelledby="traps-heading"
        >
          <div className="landing-section-heading">
            <p className="learner-eyebrow">Why you lose points</p>
            <h2 id="traps-heading">
              Knowing many words isn’t the same as finding them in a blank.
            </h2>
            <p>
              Complete the Words gives you only the first letters. You have
              to recall the rest quickly, in the right form, inside a topic
              that may be new to you.
            </p>
          </div>
          <div className="landing-trap-grid">
            <article>
              <span className="landing-trap-number">Trap 1</span>
              <h3>An unfamiliar topic</h3>
              <p>
                Passages jump between subjects such as oceanography, geology,
                archaeology and psychology. In a field you rarely read about,
                even a word you know can refuse to come to mind.
              </p>
              <div className="landing-trap-example">
                <span>Example · oceanography</span>
                <p>
                  Warmer water holds less dissolved{" "}
                  <span className="landing-trap-blank">
                    oxy<b>gen</b>
                  </span>
                  , so deep-sea fish move toward cooler layers.
                </p>
              </div>
              <p className="landing-trap-label">
                Shows up as <strong>Word retrieval</strong>
              </p>
            </article>
            <article>
              <span className="landing-trap-number">Trap 2</span>
              <h3>The right word, the wrong form</h3>
              <p>
                You know <em>significance</em> from your word list, but the
                sentence needs the adjective. If you’ve never practised how the
                word changes, you can’t complete it.
              </p>
              <div className="landing-trap-example">
                <span>Example · word family</span>
                <p>
                  The study found a{" "}
                  <span className="landing-trap-blank">
                    signific<b>ant</b>
                  </span>{" "}
                  rise in ocean temperature.
                </p>
              </div>
              <p className="landing-trap-label">
                Shows up as <strong>Word form</strong>
              </p>
            </article>
          </div>
        </section>

        <section
          className="landing-section landing-rules"
          id="rules"
          aria-labelledby="rules-heading"
        >
          <div className="landing-section-heading">
            <p className="learner-eyebrow">Word-form rules</p>
            <h2 id="rules-heading">
              Learn one word, unlock its whole family.
            </h2>
            <p>
              English word endings follow patterns. Learn these and one noun
              from your word list gives you its adjective, verb and adverb
              too. They describe what usually happens, so watch for
              exceptions.
            </p>
          </div>
          <ol className="landing-rule-list">
            {formRules.map((rule) => (
              <li key={rule.from}>
                <p className="landing-rule">
                  <span>{rule.from}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                  <span>{rule.to}</span>
                </p>
                <p className="landing-rule-examples">{rule.examples}</p>
                <p className="landing-rule-note">{rule.note}</p>
              </li>
            ))}
          </ol>
          <p className="landing-rule-tip">
            <b>Sentence signal</b> The words around the blank tell you which
            form you need: <em>a / the ___ + noun</em> needs an adjective,
            and a word that describes a verb usually ends in <em>-ly</em>.
          </p>
        </section>

        <section
          className="landing-section landing-proof"
          aria-labelledby="proof-heading"
        >
          <div className="landing-section-heading">
            <p className="learner-eyebrow">See the diagnosis</p>
            <h2 id="proof-heading">One mistake becomes a clear next step.</h2>
            <p>
              This static example uses a sentence, explanation, pattern rule,
              and drill from Pattern Study’s real practice content.
            </p>
          </div>
          <DiagnosisPreview />
        </section>

        <section
          className="landing-section landing-audience"
          aria-labelledby="audience-heading"
        >
          <div className="landing-section-heading">
            <p className="learner-eyebrow">Who it’s for</p>
            <h2 id="audience-heading">
              Different situations. A more specific practice plan.
            </h2>
            <p>
              These are example learners, not testimonials or real user results.
            </p>
          </div>
          <div className="landing-learner-grid">
            {learnerExamples.map((learner) => (
              <article key={learner.place}>
                <span className="landing-example-tag">Example learner</span>
                <h3>{learner.place}</h3>
                <p>{learner.situation}</p>
                <dl>
                  <div>
                    <dt>Likely pattern</dt>
                    <dd>{learner.pattern}</dd>
                  </div>
                  <div>
                    <dt>Drill practises</dt>
                    <dd>{learner.practice}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section
          className="landing-section landing-method"
          id="method"
          aria-labelledby="method-heading"
        >
          <div className="landing-section-heading">
            <p className="learner-eyebrow">How it works</p>
            <h2 id="method-heading">A little practice. A clearer pattern.</h2>
          </div>
          <div className="landing-steps">
            {[
              [
                "Read and complete",
                "Fill the missing letters in a short academic passage. The timer is a guide; finish at your own pace.",
              ],
              [
                "Review in context",
                "See your answers in the passage, with a short explanation for each word.",
              ],
              [
                "Practice what repeats",
                "Repeated misses become a pattern to work on with five focused sentences.",
              ],
            ].map(([title, copy], index) => (
              <article key={title}>
                <span className="landing-step-number">0{index + 1}</span>
                <HowVisual step={index + 1} />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="landing-section landing-progress"
          aria-labelledby="progress-heading"
        >
          <div className="landing-section-heading">
            <p className="learner-eyebrow">Progress</p>
            <h2 id="progress-heading">
              See what repeats, and what you’ve cleared.
            </h2>
            <p>
              Every passage and drill adds to one view: which patterns are
              still active, how your drills are going, and what to practise
              next. A 100% drill clears a pattern until the same kind of miss
              comes back.
            </p>
          </div>
          <ProgressPreview />
        </section>

        <section
          className="landing-section landing-free"
          aria-labelledby="free-heading"
        >
          <div>
            <p className="learner-eyebrow">What’s free</p>
            <h2 id="free-heading">
              Learn the loop before you decide anything.
            </h2>
          </div>
          <ul>
            <li>
              <Check size={18} aria-hidden="true" /> {FREE_PASSAGE_LIMIT}{" "}
              original passages
            </li>
            <li>
              <Check size={18} aria-hidden="true" /> Unlimited retries on those
              passages
            </li>
            <li>
              <Check size={18} aria-hidden="true" /> Unlimited targeted drills
              for those passages
            </li>
          </ul>
          <div className="landing-free-action">
            <PracticeLink />
            <p>
              Full access may be ${MONTHLY_PRICE_USD}/month later.{" "}
              <Link href="/waitlist">Join the interest list</Link> — no payment
              is taken.
            </p>
          </div>
        </section>

        <section
          className="landing-section landing-faq"
          aria-labelledby="faq-heading"
        >
          <div className="landing-section-heading">
            <p className="learner-eyebrow">FAQ</p>
            <h2 id="faq-heading">Before you start</h2>
          </div>
          <div>
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="landing-closing" aria-labelledby="closing-heading">
          <p className="learner-eyebrow">Ready for a useful answer?</p>
          <h2 id="closing-heading">
            See what your next passage can teach you.
          </h2>
          <PracticeLink />
        </section>
      </main>

      <footer className="landing-footer">
        Pattern Study · Independent practice material · Not affiliated with ETS.
      </footer>
    </div>
  );
}
