import { useRef, useState } from "react";
import { Link } from "wouter";
import { Check, X, ArrowRight } from "lucide-react";
import { getGetTargetedTrainingQueryKey, GetTargetedTrainingCategoryKey, useGetTargetedTraining, useSubmitTrainingDrill } from "@workspace/api-client-react";
import type { ResultItem, TrainingResult } from "@workspace/api-client-react";
import { InlineBlank } from "./inline-blank";
import { drillForCategory, finishDrill } from "../lib/practice-history";
import { readHistory, saveHistory } from "../lib/history-storage";
import "../practice.css";

export function TrainingFlow() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session") || sessionStorage.getItem("pp-session") || "";
  const categoryKey = Object.values(GetTargetedTrainingCategoryKey).find(k => k === params.get("category"));
  const training = useGetTargetedTraining(sessionId, { categoryKey }, { query: { queryKey: getGetTargetedTrainingQueryKey(sessionId, { categoryKey }), enabled: !!sessionId, retry: false } });
  const submit = useSubmitTrainingDrill();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<ResultItem | null>(null);
  const [result, setResult] = useState<TrainingResult | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const action = useRef<HTMLButtonElement | null>(null);
  const prompts = training.data?.prompts || [];
  const prompt = prompts[index];
  // Derive the category from the API's selected drill, never an arbitrary URL label.
  const category = Object.entries(drillForCategory).find(([, key]) => key === training.data?.categoryKey)?.[0] || "Word form";
  const check = () => {
    if (!prompt || submit.isPending) return;
    submit.mutate({ sessionId, params: { categoryKey }, data: { itemId: prompt.id, answers: [{ blankId: prompt.id, value: answers[prompt.id] || "" }] } }, {
      onSuccess: r => { setFeedback(r.items[0]); requestAnimationFrame(() => action.current?.focus()); },
    });
  };
  const next = () => {
    if (submit.isPending) return;
    if (index < prompts.length - 1) {
      setIndex(i => i + 1); setFeedback(null); submit.reset();
      requestAnimationFrame(() => input.current?.focus());
      return;
    }
    submit.mutate({ sessionId, params: { categoryKey }, data: { answers: prompts.map(p => ({ blankId: p.id, value: answers[p.id] || "" })) } }, {
      onSuccess: r => {
        setResult(r);
        saveHistory(finishDrill(readHistory(), category, r.score, r.total));
        requestAnimationFrame(() => document.getElementById("drill-result")?.focus());
      },
    });
  };
  const split = prompt?.prompt.split(/_{2,}/) || [""];
  const before = prompt?.prefix && split[0].endsWith(prompt.prefix) ? split[0].slice(0, -prompt.prefix.length) : split[0];
  return <div className="learner-page drill-page">
    <header className="drill-header"><Link href="/results" aria-label="Close practice"><X size={24}/></Link><div className="drill-segments" role="progressbar" aria-label="Drill progress" aria-valuemin={0} aria-valuemax={5} aria-valuenow={result ? 5 : index + (feedback ? 1 : 0)}>{Array.from({ length: 5 }, (_, i) => <span key={i} className={i <= index ? "active" : ""}/>)}</div><span>{result ? 5 : index + 1} / 5</span></header>
    <main className="drill-main">
      {!sessionId || training.isError ? <div><h1>Start with a passage.</h1><p>This practice session is no longer available. Complete a passage to start a fresh drill.</p><Link className="learner-button" href="/practice">Go to practice</Link></div> : training.isLoading ? <p role="status">Loading your sentences…</p> : prompts.length !== 5 ? <div><p>This drill isn’t ready yet.</p><Link href="/results">Back to your answers</Link></div> : result ? <section className="drill-complete"><p className="learner-eyebrow">Practice complete</p><h1 id="drill-result" tabIndex={-1}>{result.score} / {result.total} correct</h1><p>{result.score === 5 ? `No misses this time. We’ve cleared the current ${category.toLowerCase()} evidence from your recent patterns.` : "A few to revisit. Your recent pattern history stays as it is."}</p><Link className="learner-button" href="/results">Back to my answers <ArrowRight size={16}/></Link><Link href="/dashboard">View progress</Link></section> : <>
        <p className="learner-eyebrow">{category} practice</p>
        <p className="drill-sentence">{before}{feedback ? <span className={feedback.isCorrect ? "drill-correct" : "drill-correction"}>{!feedback.isCorrect && <><del>{prompt.prefix}{feedback.submitted || "—"}</del>{" "}</>}<span>{feedback.fullWord}</span></span> : <InlineBlank key={prompt.id} id={prompt.id} prefix={prompt.prefix} length={prompt.missingLength} value={answers[prompt.id] || ""} disabled={submit.isPending} inputRef={node => { input.current = node; }} onChange={value => setAnswers(a => ({ ...a, [prompt.id]: value }))} onNext={check} onPrevious={() => {}}/>}{split.slice(1).join(" ")}</p>
        {feedback && <section className="drill-feedback" role="status"><h2>{feedback.isCorrect ? <Check size={20}/> : <X size={20}/>} {feedback.isCorrect ? "Correct" : "Not quite"}</h2><p>{feedback.explanation}</p></section>}
        {submit.isError && <p role="alert">We couldn’t check this answer. Please try again.</p>}
        <button ref={action} className="learner-button drill-action" onClick={feedback ? next : check} disabled={submit.isPending}>{submit.isPending ? "Checking…" : feedback ? index === 4 ? "Finish practice" : "Next" : "Check answer"}</button>
      </>}
    </main>
  </div>;
}
