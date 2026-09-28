import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { FREE_PASSAGE_LIMIT, MONTHLY_PRICE_USD } from "../lib/product-config";
import "../practice.css";

export function LandingPage() {
  const freeCopy = `Try ${FREE_PASSAGE_LIMIT === 2 ? "two" : FREE_PASSAGE_LIMIT} passages free`;
  return <div className="learner-page landing-page">
    <header className="learner-nav"><Link href="/" className="learner-brand">patternpilot</Link><nav aria-label="Main navigation"><Link href="/practice">Practice</Link><Link href="/dashboard">Progress</Link></nav></header>
    <main className="learner-main">
      <section className="landing-intro"><p className="learner-eyebrow">Reading / Complete the Words</p><h1>Know what to<br/>practice next.</h1><p className="landing-lede">Fill in a short passage. See which kinds of words trip you up. Work on them, one sentence at a time.</p><Link className="learner-button" href="/practice">{freeCopy} <ArrowRight size={16}/></Link><p className="landing-note">No account needed. Your practice history stays in this browser.</p></section>
      <section className="landing-example" aria-labelledby="example-heading"><p className="learner-eyebrow" id="example-heading">An example of the feedback</p><p className="landing-sentence">The evidence <span>suggests</span> a shift.</p><p>“The evidence suggests” takes -s: evidence is treated as one body of information.</p></section>
      <section className="landing-method" aria-labelledby="method-heading"><h2 id="method-heading">A little practice. A clearer pattern.</h2>{[
        ["Read and complete", "Fill the missing letters in a short academic passage. The timer is a guide; finish at your own pace."],
        ["Review in context", "See your answers in the passage, with a short explanation for each word."],
        ["Practice what repeats", "Repeated misses become a pattern to work on with five focused sentences."],
      ].map(([title,copy],i)=><div key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{copy}</p></div></div>)}</section>
      <section className="landing-offer"><h2>Start with a passage.</h2><p>{FREE_PASSAGE_LIMIT} different passages are free. You can retry them and take targeted drills without using another passage.</p><Link className="learner-button" href="/practice">{freeCopy} <ArrowRight size={16}/></Link><p className="landing-note">Interested in more? <Link href="/waitlist">Join the ${MONTHLY_PRICE_USD}/month full-access waitlist.</Link> No payment today.</p></section>
    </main>
    <footer className="landing-footer">© {new Date().getFullYear()} PatternPilot · Independent practice material.</footer>
  </div>;
}
