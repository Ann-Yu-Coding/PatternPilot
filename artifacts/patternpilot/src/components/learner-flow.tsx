import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, RotateCcw, UserRound } from "lucide-react";
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
import { PatternCard } from "./pattern-card";
import { readHistory, saveHistory } from "../lib/history-storage";
import {
  recordAttempt,
  findPattern,
  latestPassages,
  missCategory,
  drillForCategory,
} from "../lib/practice-history";
import { InlineBlank } from "./inline-blank";
import { categoryLabel, timeLabel, wordChange } from "../lib/learner-review";
import "../practice.css";

const REVIEW_KEY = "pp-learner-review";
type Review = { set: PracticeSet; result: PracticeResult; elapsed: number };
function storedReview(): Review | null {
  try {
    const review = JSON.parse(sessionStorage.getItem(REVIEW_KEY) || "null");
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

function AnswerTable({
  result,
  set,
}: {
  result: PracticeResult;
  set: PracticeSet;
}) {
  const mistakes = result.items.filter((item) => !item.isCorrect);
  const correct = result.items.filter((item) => item.isCorrect);
  const patternWords = new Set(
    result.topWeakness.evidence.map((evidence) => evidence.split(" · ")[0]),
  );
  const row = (item: ResultItem) => {
    const prefix =
      set.blanks.find((blank) => blank.id === item.blankId)?.prefix || "";
    return (
      <tr key={item.blankId}>
        <td data-label="Your answer" className="learner-answer-word">
          {item.isCorrect ? (
            item.fullWord
          ) : (
            <MarkedWord item={item} prefix={prefix} correction={false} />
          )}
        </td>
        <td data-label="Correct">
          {item.isCorrect ? (
            <Check className="learner-check" size={21} aria-label="Correct" />
          ) : (
            <span className="learner-answer-word learner-correct-word">
              {item.fullWord}
            </span>
          )}
        </td>
        <td data-label="Type">
          <span
            className={`learner-tag ${!item.isCorrect && result.topWeakness.count >= 2 && patternWords.has(item.fullWord) ? "is-pattern" : ""}`}
          >
            {categoryLabel(item.errorCategory)}
          </span>
        </td>
        <td data-label="Why this answer" className="learner-explanation">
          <p>{item.explanation}</p>
        </td>
      </tr>
    );
  };
  return (
    <section className="learner-answers" aria-labelledby="answers-title">
      <div className="learner-section-heading">
        <h2 id="answers-title">All answers</h2>
        <span>
          {mistakes.length} mistakes · {correct.length} correct
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th scope="col">Your answer</th>
            <th scope="col">Correct</th>
            <th scope="col">Type</th>
            <th scope="col">Why this answer</th>
          </tr>
        </thead>
        <tbody>
          {mistakes.map(row)}
          {correct.length > 0 && (
            <tr className="learner-correct-divider">
              <th colSpan={4} scope="rowgroup">
                Correct · {correct.length}
              </th>
            </tr>
          )}
          {correct.map(row)}
        </tbody>
      </table>
    </section>
  );
}

export function LearnerFlow() {
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
  const sets = (data || []).slice(0, 3);
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
  const pattern = result ? findPattern(history, result.sessionId) : null;
  const primary = pattern
    ? result?.weaknesses.find(
        (w) => w.key === drillForCategory[pattern.category],
      )
    : undefined;
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
              timestamp,
              score: nextResult.score,
              total: nextResult.total,
              elapsed: seconds,
              misses: nextResult.items
                .filter((item) => !item.isCorrect)
                .map((item) => ({
                  blankId: item.blankId,
                  errorCategory: missCategory(item),
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
          patternpilot
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/practice" className="active" aria-current="page">
            Practice
          </Link>
          <Link href="/dashboard">Progress</Link>
          <Link href="/login" className="learner-avatar" aria-label="Account">
            <UserRound size={20} />
          </Link>
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
            </section>
            {result && review && (
              <section
                className="learner-results"
                ref={resultsRef}
                tabIndex={-1}
                aria-label="Your results"
              >
                <p className="learner-eyebrow">Results</p>
                <div className="learner-score">
                  <h2>
                    {result.score} of {result.total}
                  </h2>
                  <span>correct · {timeLabel(review.elapsed)}</span>
                </div>
                {pattern ? (
                  <PatternCard
                    pattern={pattern}
                    sessionId={result.sessionId}
                    drillCount={primary?.drillCount}
                  />
                ) : (
                  <section className="learner-no-pattern">
                    <h2>
                      {mistakes === 0
                        ? "Every word in place."
                        : "Pattern checked."}
                    </h2>
                    <p>
                      {mistakes === 0
                        ? "You’re ready for the next passage."
                        : "Review the answers below, then try another passage."}
                    </p>
                  </section>
                )}
                <AnswerTable result={result} set={current} />
                <button
                  className="learner-button retry"
                  onClick={() => reset()}
                  data-testid="button-retry-passage"
                >
                  <RotateCcw size={18} />
                  Try this passage again
                </button>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
