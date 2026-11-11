import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import {
  useListPracticeSets,
  useStartPracticeSession,
  useSubmitPracticeSession,
} from "@workspace/api-client-react";
import type {
  PracticeSet,
  PracticeResult,
  ResultItem,
} from "@workspace/api-client-react";
import { PracticePicker } from "./practice-picker";
import { NextPassage } from "./next-passage";
import { canOpenPassage, nextPassageId } from "../lib/free-practice";
import { SEEDED_PASSAGE_ORDER } from "../lib/product-config";
import { PatternCard } from "./pattern-card";
import { readHistory, saveHistory } from "../lib/history-storage";
import {
  recordAttempt,
  findPatterns,
  latestPassages,
  missCategory,
  drillForCategory,
} from "../lib/practice-history";
import { InlineBlank } from "./inline-blank";
import { timeLabel, wordChange } from "../lib/learner-review";
import "../practice.css";

const REVIEW_KEY = "pp-learner-review";
type Review = { set: PracticeSet; result: PracticeResult; elapsed: number };
function storedReview(): Review | null {
  try {
    const attemptId = new URLSearchParams(window.location.search).get("attempt");
    const review = attemptId
      ? readHistory().attempts.find(a => a.id === attemptId)?.review
      : JSON.parse(sessionStorage.getItem(REVIEW_KEY) || "null");
    return review?.set?.id &&
      typeof review.set.passage === "string" &&
      Array.isArray(review.set.blanks) &&
      Array.isArray(review.result?.items) &&
      review.result?.topWeakness &&
      Number.isFinite(review.elapsed)
      ? review
      : null;
  } catch {
    return null;
  }
}

function Ring({
  fraction,
  children,
  label,
}: {
  fraction: number;
  children?: React.ReactNode;
  label: string;
}) {
  return (
    <span className="learner-ring" role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring-track" cx="50" cy="50" r="43" />
        <circle
          className="ring-value"
          cx="50"
          cy="50"
          r="43"
          pathLength="100"
          strokeDasharray={`${Math.min(1, Math.max(0, fraction)) * 100} 100`}
        />
      </svg>
      {children && <span className="ring-label">{children}</span>}
    </span>
  );
}

function MarkedWord({
  item,
  prefix,
  correction = true,
}: {
  item: ResultItem;
  prefix: string;
  correction?: boolean;
}) {
  if (item.isCorrect)
    return <span className="learner-correct-word">{item.fullWord}</span>;
  if (!item.submitted.trim() && !correction) return <span>Skipped</span>;
  if (!item.submitted.trim())
    return (
      <span className="learner-mistake-word">
        <span className="sr-only">Skipped. Correct answer: </span>
        {correction ? (
          <>
            <span aria-hidden="true">
              {prefix}
              <del>___</del>
            </span>
            <span className="learner-correct-word">
              {item.fullWord.slice(prefix.length)}
            </span>
          </>
        ) : (
          <span>Skipped</span>
        )}
      </span>
    );
  const entered = prefix + item.submitted;
  const change = wordChange(entered, item.fullWord);
  return (
    <span
      className={correction ? "learner-mistake-word" : "learner-answer-word"}
      aria-label={
        correction
          ? `You entered ${entered}. Correct answer: ${item.fullWord}.`
          : `You entered ${entered}.`
      }
    >
      <span aria-hidden="true">
        {change.before}
        <del>{change.wrong}</del>
        {correction && <ins>{change.right}</ins>}
        {change.after}
      </span>
    </span>
  );
}

// A few words either side of one blank, with every blank filled in with its
// correct word, e.g. "…the growth and [survival] of entire forests." Built
// only from data already on the page.
function contextSnippet(set: PracticeSet, items: ResultItem[], blankId: string) {
  const fill = (text: string) =>
    text.replace(/(\S*)\{\{([^}]+)\}\}/g, (_, lead: string, id: string) => {
      const prefix = set.blanks.find((blank) => blank.id === id)?.prefix || "";
      const word = items.find((item) => item.blankId === id)?.fullWord || "";
      return (lead.endsWith(prefix) ? lead.slice(0, lead.length - prefix.length) : lead) + word;
    });
  const token = `{{${blankId}}}`;
  const at = set.passage.indexOf(token);
  if (at < 0) return null;
  const prefix = set.blanks.find((blank) => blank.id === blankId)?.prefix || "";
  const sentenceStart = Math.max(
    set.passage.lastIndexOf(". ", at),
    set.passage.lastIndexOf("? ", at),
    set.passage.lastIndexOf("! ", at),
  );
  const rest = set.passage.slice(at + token.length);
  const end = rest.search(/[.?!](\s|$)/);
  const beforeWords = fill(
    set.passage.slice(sentenceStart < 0 ? 0 : sentenceStart + 2, at - prefix.length),
  ).split(/\s+/).filter(Boolean);
  const afterWords = fill(end < 0 ? rest : rest.slice(0, end + 1))
    .split(/\s+/).filter(Boolean);
  const keep = 5;
  const word = items.find((item) => item.blankId === blankId)?.fullWord || "";
  return (
    <>
      {beforeWords.length > keep ? "…" : ""}
      {beforeWords.slice(-keep).join(" ")}
      {beforeWords.length ? " " : ""}
      <mark>{word}</mark>
      {afterWords.length && !/^[.,;:?!]/.test(afterWords[0]) ? " " : ""}
      {afterWords.slice(0, keep).join(" ").replace(/^\s+/, "")}
      {afterWords.length > keep ? "…" : ""}
    </>
  );
}

function AnswerReview({
  result,
  set,
}: {
  result: PracticeResult;
  set: PracticeSet;
}) {
  const mistakes = result.items.filter((item) => !item.isCorrect);
  const correct = result.items.filter((item) => item.isCorrect);
  const prefixOf = (item: ResultItem) =>
    set.blanks.find((blank) => blank.id === item.blankId)?.prefix || "";
  return (
    <section className="learner-answers" aria-labelledby="answers-title">
      {mistakes.length > 0 && (
        <>
          <div className="learner-section-heading">
            <h2 id="answers-title">
              Review your {mistakes.length}{" "}
              {mistakes.length === 1 ? "mistake" : "mistakes"}
            </h2>
            <p>From this passage</p>
          </div>
          <ol className="learner-mistakes">
            {mistakes.map((item, index) => (
              <li key={item.blankId} className="learner-mistake">
                <span className="learner-mistake-tag">
                  {String(index + 1).padStart(2, "0")}
                  {item.missCategory && (
                    <>
                      {" · "}
                      <span title={item.missCategory}>
                        <span aria-hidden="true">
                          {typeChipLabel[item.missCategory] ?? item.missCategory}
                        </span>
                        <span className="sr-only">{item.missCategory}</span>
                      </span>
                    </>
                  )}
                </span>
                <div className="learner-mistake-words">
                  <div>
                    <small>Your answer</small>
                    <span className="learner-answer-word">
                      <MarkedWord item={item} prefix={prefixOf(item)} correction={false} />
                    </span>
                  </div>
                  <ArrowRight size={20} aria-hidden="true" />
                  <div>
                    <small>Correct answer</small>
                    <span className="learner-answer-word learner-correct-word">
                      {item.fullWord}
                    </span>
                  </div>
                </div>
                <div className="learner-mistake-why">
                  <p className="learner-mistake-context">
                    <b>Context</b>
                    <span>{contextSnippet(set, result.items, item.blankId)}</span>
                  </p>
                  <p>
                    <b>Why</b>
                    <span>{item.explanation}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
      {correct.length > 0 && (
        <details className="learner-correct-list" open={mistakes.length === 0}>
          <summary>
            <Check size={20} aria-hidden="true" />
            <span>
              {mistakes.length === 0 ? (
                <span id="answers-title">All {correct.length} answers correct</span>
              ) : (
                `${correct.length} correct ${correct.length === 1 ? "answer" : "answers"}`
              )}
            </span>
            <small>Show answers and explanations</small>
          </summary>
          <ul>
            {correct.map((item) => (
              <li key={item.blankId}>
                <span className="learner-answer-word">{item.fullWord}</span>
                <p>{item.explanation}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

// One-word chip for the "Type" column; the full category stays in the
// tooltip and for screen readers.
const typeChipLabel: Record<string, string> = {
  "Grammar ending": "Grammar",
  "Word form": "Form",
  Spelling: "Spelling",
  "Word retrieval": "Recall",
  "Context / meaning": "Context",
};

export function LearnerFlow() {
  const [,navigate] = useLocation();
  const { data, isLoading, isError, refetch } = useListPracticeSets();
  const start = useStartPracticeSession();
  const submit = useSubmitPracticeSession();
  const [review, setReview] = useState<Review | null>(storedReview);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => review?.set.id || null,
  );
  const [history, setHistory] = useState(readHistory);
  const scores = Object.fromEntries(
    latestPassages(history).map((a) => [
      a.passageId,
      Math.round((a.score / Math.max(1, a.total)) * 100),
    ]),
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const startedAt = useRef(Date.now());
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const resultsRef = useRef<HTMLElement | null>(null);
  const sessionId = useRef<string | null>(null);
  const submitting = useRef(false);
  const sets = SEEDED_PASSAGE_ORDER.flatMap(id => (data || []).filter(set=>set.id===id));
  const current =
    review?.set || sets.find((set) => set.id === selectedId) || sets[0];
  const blanks = current
    ? [...current.blanks].sort(
        (a, b) =>
          current.passage.indexOf(`{{${a.id}}}`) -
          current.passage.indexOf(`{{${b.id}}}`),
      )
    : [];
  const result = review?.result;
  const busy = start.isPending || submit.isPending;
  const remaining = Math.max(0, 180 - elapsed);
  const mistakes = result?.items.filter((item) => !item.isCorrect).length || 0;
  const patterns = result ? findPatterns(history, result.sessionId) : [];
  useEffect(() => {
    const sync = () => setHistory(readHistory());
    window.addEventListener("storage", sync);
    window.addEventListener("pp-history-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("pp-history-change", sync);
    };
  }, []);

  useEffect(() => {
    if (!current || review) return;
    startedAt.current = Date.now();
    setElapsed(0);
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [current?.id, attempt, !!review]);

  useEffect(() => {
    if (!review) return;
    const frame = requestAnimationFrame(() => {
      const section = resultsRef.current;
      if (!section) return;
      section.focus({ preventScroll: true });
      window.scrollTo({
        top: Math.max(
          0,
          window.scrollY + section.getBoundingClientRect().top - 136,
        ),
        behavior: "instant",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [review]);

  const reset = (id = current?.id) => {
    if (id && !canOpenPassage(readHistory(),id)) { navigate("/unlock"); return; }
    setReview(null);
    setSelectedId(id || null);
    setAnswers({});
    setElapsed(0);
    setAttempt((value) => value + 1);
    sessionId.current = null;
    start.reset();
    submit.reset();
    try {
      sessionStorage.removeItem(REVIEW_KEY);
      sessionStorage.removeItem("pp-result");
      sessionStorage.removeItem("pp-session");
    } catch {
      /* In-memory practice still works. */
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const focusNext = (id: string, values = answers) => {
    const index = blanks.findIndex((blank) => blank.id === id);
    const next = [...blanks.slice(index + 1), ...blanks.slice(0, index)].find(
      (blank) => (values[blank.id] || "").length < blank.missingLength,
    );
    if (next) inputRefs.current[next.id]?.focus();
  };
  const checkAnswers = () => {
    if (!current || submitting.current || review) return;
    if (!canOpenPassage(readHistory(),current.id)) { navigate("/unlock"); return; }
    submitting.current = true;
    const seconds = Math.floor((Date.now() - startedAt.current) / 1000);
    const finish = (id: string) =>
      submit.mutate(
        {
          sessionId: id,
          data: {
            answers: blanks.map((blank) => ({
              blankId: blank.id,
              value: answers[blank.id] || "",
            })),
          },
        },
        {
          onSuccess: (nextResult) => {
            const nextReview = {
              set: current,
              result: nextResult,
              elapsed: seconds,
            };
            try {
              sessionStorage.setItem(REVIEW_KEY, JSON.stringify(nextReview));
              sessionStorage.setItem("pp-result", JSON.stringify(nextResult));
              sessionStorage.setItem("pp-session", id);
            } catch {
              /* Keep review visible even when storage is unavailable. */
            }
            const timestamp = Date.now();
            const nextHistory = recordAttempt(readHistory(), {
              id: nextResult.sessionId,
              passageId: current.id,
              title: current.title,
              topic: current.topic,
              review: nextReview,
              timestamp,
              score: nextResult.score,
              total: nextResult.total,
              elapsed: seconds,
              misses: nextResult.items
                .filter((item) => !item.isCorrect && missCategory(item) !== null)
                .map((item) => ({
                  blankId: item.blankId,
                  errorCategory: missCategory(item)!,
                  passageId: current.id,
                  timestamp,
                })),
            });
            saveHistory(nextHistory);
            setHistory(nextHistory);
            setReview(nextReview);
          },
          onSettled: () => {
            submitting.current = false;
          },
        },
      );
    if (sessionId.current) finish(sessionId.current);
    else
      start.mutate(
        { data: { setIds: [current.id] } },
        {
          onSuccess: (session) => {
            sessionId.current = session.id;
            finish(session.id);
          },
          onError: () => {
            submitting.current = false;
          },
        },
      );
  };
  const passage = () =>
    current?.passage.split(/(\{\{[^}]+\}\})/g).map((part, index, parts) => {
      const id = part.match(/^\{\{([^}]+)\}\}$/)?.[1];
      if (!id) {
        const nextId = parts[index + 1]?.match(/^\{\{([^}]+)\}\}$/)?.[1];
        const next = blanks.find((blank) => blank.id === nextId);
        return (
          <Fragment key={index}>
            {next?.prefix && part.endsWith(next.prefix)
              ? part.slice(0, -next.prefix.length)
              : part}
          </Fragment>
        );
      }
      const blank = blanks.find((item) => item.id === id);
      if (!blank) return <Fragment key={index}>{part}</Fragment>;
      const item = result?.items.find((item) => item.blankId === id);
      if (item)
        return <MarkedWord key={id} item={item} prefix={blank.prefix} />;
      return (
        <InlineBlank
          key={id}
          id={id}
          prefix={blank.prefix}
          length={blank.missingLength}
          value={answers[id] || ""}
          disabled={busy}
          inputRef={(node) => {
            inputRefs.current[id] = node;
          }}
          onChange={(value, advance) => {
            const next = { ...answers, [id]: value };
            setAnswers(next);
            if (advance && value.length === blank.missingLength)
              focusNext(id, next);
          }}
          onNext={() => focusNext(id)}
          onPrevious={() => {
            const previous =
              blanks[blanks.findIndex((item) => item.id === id) - 1];
            if (previous) inputRefs.current[previous.id]?.focus();
          }}
        />
      );
    });
  return (
    <div className="learner-page">
      <header className="learner-nav">
        <Link href="/" className="learner-brand">
          pattern study
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/practice" className="active" aria-current="page">
            Practice
          </Link>
          <Link href="/dashboard">Progress</Link>
        </nav>
      </header>
      <main className="learner-main">
        {!current ? (
          <div className="learner-load" role="status">
            {isLoading ? (
              "Loading your passage…"
            ) : isError ? (
              <>
                We couldn’t load your passage.{" "}
                <button
                  className="learner-button secondary"
                  onClick={() => refetch()}
                >
                  Try again
                </button>
              </>
            ) : (
              "No practice passages available."
            )}
          </div>
        ) : (
          <>
            {!result && (
              <header className="learner-intro">
                <p className="learner-eyebrow">Reading / Complete the Words</p>
                <h1>Complete each word with the missing letters.</h1>
                <p className="learner-subtitle">
                  A little practice. A clearer pattern.
                </p>
              </header>
            )}
            {result && review && (
              <section
                className="learner-results"
                ref={resultsRef}
                tabIndex={-1}
                aria-labelledby="results-title"
              >
                <p className="learner-eyebrow">Results</p>
                <h1 id="results-title">Your passage review</h1>
                <div className="learner-score">
                  <h2>
                    {result.score} / {result.total} <span>correct</span>
                  </h2>
                  <p>
                    {mistakes} {mistakes === 1 ? "mistake" : "mistakes"} · Time
                    taken {timeLabel(review.elapsed)}
                  </p>
                </div>
                {patterns.length ? (
                  <div className="pattern-observations">
                    {patterns.map((pattern) => (
                      <PatternCard
                        key={pattern.category}
                        pattern={pattern}
                        sessionId={result.sessionId}
                      />
                    ))}
                  </div>
                ) : (
                  <section className="learner-no-pattern">
                    <p>
                      {mistakes === 0
                        ? "Nice work — no repeated pattern showed up here."
                        : "No active pattern to check. Review the answers below."}
                    </p>
                    {mistakes === 0 && (
                      <p>Try one more passage to check for smaller gaps that didn’t appear in this one.</p>
                    )}
                  </section>
                )}
                <AnswerReview result={result} set={current} />
              </section>
            )}
            <section
              aria-labelledby="passage-title"
              className="learner-passage-section"
            >
              <div className={`learner-meta ${result ? "is-review" : ""}`}>
                <div>
                  {sets.length > 1 && !result ? (
                    <PracticePicker
                      sets={sets}
                      selectedId={current.id}
                      scores={scores}
                      disabled={busy}
                      onSelect={reset}
                    />
                  ) : (
                    <span>
                      Practice{" "}
                      {String(
                        Math.max(
                          0,
                          sets.findIndex((set) => set.id === current.id),
                        ) + 1,
                      ).padStart(2, "0")}
                    </span>
                  )}
                  <span className="learner-meta-topic">{current.topic}</span>
                </div>
                {!result && (
                  <div
                    className="learner-timer"
                    role="timer"
                    aria-label={`${timeLabel(remaining)} remaining`}
                  >
                    <Ring fraction={remaining / 180} label="Time remaining" />
                    <strong>{timeLabel(remaining)}</strong>
                  </div>
                )}
              </div>
              <h2 id="passage-title">{current.title}</h2>
              {result && (
                <div className="learner-legend">
                  <span>
                    <span className="learner-correct-word">correct</span>{" "}
                    {result.score}
                  </span>
                  <span>
                    <span className="learner-mistake-word">
                      mis<del>s</del>
                      <ins>take</ins>
                    </span>{" "}
                    {mistakes}
                  </span>
                </div>
              )}
              <p className="practice-passage">{passage()}</p>
              {!result && (
                <div className="learner-submit">
                  <p>Tab to move between words</p>
                  <button
                    className="learner-button"
                    disabled={busy}
                    onClick={checkAnswers}
                    data-testid="button-submit-practice"
                  >
                    {busy ? "Checking answers…" : "Check answers"}
                  </button>
                </div>
              )}
              {(start.isError || submit.isError) && (
                <p className="learner-error" role="alert">
                  We couldn’t check your answers. Your entries are still here.
                  Please try again.
                </p>
              )}
              {result && (
                  <NextPassage allCorrect={mistakes === 0} history={history} next={sets.find(s=>s.id===nextPassageId(history,sets.map(s=>s.id)))} onRetry={()=>reset()} onNext={()=>{const id=nextPassageId(readHistory(),sets.map(s=>s.id)); if(id)reset(id);}}/>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
