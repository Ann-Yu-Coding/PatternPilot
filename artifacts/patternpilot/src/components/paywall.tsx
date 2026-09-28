import { useState } from "react";
import { Link } from "wouter";
import { Check } from "lucide-react";
import { LearnerShell } from "./learner-shell";
import { readHistory } from "../lib/history-storage";
import { latestPassages, findPatterns } from "../lib/practice-history";
import { FREE_PASSAGE_LIMIT, MONTHLY_PRICE_USD } from "../lib/product-config";
export function Paywall() {
 const history=readHistory(), latest=latestPassages(history), patterns=findPatterns(history);
 const score=latest.reduce((n,a)=>n+a.score,0), total=latest.reduce((n,a)=>n+a.total,0);
 return <LearnerShell><section className="paywall-panel"><p className="learner-eyebrow">{latest.length>=FREE_PASSAGE_LIMIT ? "Free practice complete" : "Full access"}</p><h1>{latest.length>=FREE_PASSAGE_LIMIT ? `You’ve used your ${FREE_PASSAGE_LIMIT} free passages.` : "More practice, when you’re ready."}</h1>{total>0 && <div className="paywall-summary"><p>So far · latest attempts</p><strong>{score} / {total} correct{patterns.length ? ` · ${patterns[0].possible ? "Possible pattern" : "Pattern"}: ${patterns[0].category}` : ""}</strong></div>}
 <ul>{["Access to every available passage", "Patterns tracked across your practice", "Targeted practice for recurring misses"].map(text=><li key={text}><Check size={18}/>{text}</li>)}</ul>
 <Link className="learner-button" href="/waitlist">Unlock full access · ${MONTHLY_PRICE_USD}/month</Link><p className="paywall-note">Join the waitlist for this experimental offer. No payment is taken.</p><Link className="paywall-back" href="/results">Not now: review my answers</Link>
 </section></LearnerShell>;
}
export function Waitlist() {
 const [email,setEmail]=useState(""),[status,setStatus]=useState<"idle"|"saving"|"saved"|"error">("idle");
 return <LearnerShell><section className="paywall-panel"><p className="learner-eyebrow">Early access</p><h1>{status==="saved" ? "You’re on the list." : "Join the waitlist"}</h1>{status==="saved" ? <p>We’ll email you when full access is available.</p> : <><p>Register your interest in full access at ${MONTHLY_PRICE_USD}/month. No payment or subscription starts today.</p><form onSubmit={async event=>{event.preventDefault(); if(status==="saving")return;setStatus("saving");try{const response=await fetch(`${import.meta.env.BASE_URL}api/waitlist`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim()})});if(!response.ok)throw new Error();setStatus("saved");setEmail("");}catch{setStatus("error");}}}><label>Email address<input type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" disabled={status==="saving"}/></label>{status==="error" && <p role="alert">We couldn’t save your email. Please try again.</p>}<button className="learner-button" disabled={status==="saving"}>{status==="saving" ? "Saving…" : "Join the waitlist"}</button><p className="paywall-note">We’ll use your email to contact you about PatternPilot access.</p></form></>}<Link className="paywall-back" href="/results">Back to my answers</Link></section></LearnerShell>;
}
