import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import { FREE_PASSAGE_LIMIT, MONTHLY_PRICE_USD } from "../lib/product-config";
import "../practice.css";
import "./landing-page.css";

const freeCopy = `Try ${FREE_PASSAGE_LIMIT === 2 ? "two" : FREE_PASSAGE_LIMIT} passages free`;

function PracticeLink({ className = "" }: { className?: string }) {
  return (
    <Link className={`learner-button ${className}`.trim()} href="/practice">
      {freeCopy} <ArrowRight size={16} aria-hidden="true" />
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

function MarkedSentence() {
  return (
    <p className="landing-demo-sentence">
      Scientists are now{" "}
      <span className="landing-mistake">
        <del>studyed</del> <ins>studying</ins>
      </span>{" "}
      how these connections influence the growth and survival of entire forests.
    </p>
  );
}

function DiagnosisPreview({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <aside
        className="landing-hero-preview"
        aria-label="A preview of PatternPilot feedback"
      >
        <div className="landing-preview-bar">
          <span>After checking</span>
          <span>
            <b>studyed</b> → studying
          </span>
        </div>
        <div className="landing-preview-card">
          <span className="learner-pattern-badge">Pattern</span>
          <h2>
            Grammar <mark>ending</mark>
          </h2>
          <p>Check who does the action and when it happens.</p>
          <SeenDots compact />
        </div>
      </aside>
    );
  }

  return (
    <div className="landing-diagnosis-demo">
      <div className="landing-demo-passage">
        <p className="landing-demo-label">Marked passage · seeded practice</p>
        <MarkedSentence />
        <div className="landing-why">
          <span>Why</span>
          <p>“Are now studying” describes an action in progress.</p>
        </div>
      </div>

      <section
        className="learner-pattern landing-pattern-card"
        aria-label="Example Grammar ending pattern card"
      >
        <div className="learner-pattern-copy">
          <span className="learner-pattern-badge">Pattern</span>
          <h2>
            Grammar <mark>ending</mark>
          </h2>
          <p>Check who does the action and when it happens.</p>
          <p className="pattern-evidence">
            Pattern rule · 2 similar misses in recent passages
          </p>
          <div className="landing-drill-preview">
            <span>First drill sentence</span>
            <p>
              The evidence suggest
              <span className="landing-slots" aria-label="one missing letter">
                _
              </span>{" "}
              a shift.
            </p>
          </div>
        </div>
        <SeenDots />
      </section>
    </div>
  );
}

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
        <span>Scientists are study</span>
        <b>_ _ _</b>
        <span> the sample.</span>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="landing-how-visual landing-how-review" aria-hidden="true">
        <span>
          <del>studyed</del> <ins>studying</ins>
        </span>
        <small>Why · “Are now studying” describes an action in progress.</small>
      </div>
    );
  }
  return (
    <div className="landing-how-visual landing-how-pattern" aria-hidden="true">
      <span>Grammar ending</span>
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
    "No. PatternPilot uses original practice passages and is not affiliated with or endorsed by ETS.",
  ],
  [
    "Which devices work?",
    "PatternPilot is designed phone-first and also works in current tablet and desktop browsers. Your history stays with the browser and device you used.",
  ],
];

export function LandingPage() {
  return (
    <div className="learner-page landing-page">
      <header className="learner-nav landing-nav">
        <Link href="/" className="learner-brand">
          patternpilot
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/practice">Practice</Link>
          <Link href="/dashboard">Progress</Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="learner-eyebrow">TOEFL · COMPLETE THE WORDS</p>
            <h1>Find out why you miss words, not just how many.</h1>
            <p className="landing-lede">
              Complete a short academic passage, see the pattern behind your
              mistakes, then practise it in context.
            </p>
            <PracticeLink />
            <p className="landing-note">
              No account needed. Your practice history stays in this browser.
            </p>
          </div>
          <DiagnosisPreview compact />
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
              and drill from PatternPilot’s real practice content.
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
        PatternPilot · Independent practice material · Not affiliated with ETS.
      </footer>
    </div>
  );
}
