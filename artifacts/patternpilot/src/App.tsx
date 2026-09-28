import { LandingPage } from "@/components/landing-page";
import { TrainingFlow } from "@/components/training-flow";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Link, Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { ArrowRight, BarChart3, BookOpen, Check, ChevronRight, CircleHelp, FileJson, FileText, Home, LockKeyhole, Menu, Plus, RefreshCw, Search, Settings2, Sparkles, Target, Upload, X } from "lucide-react";
import { getGetTargetedTrainingQueryKey, getListAdminQuestionsQueryKey, useCreateAdminQuestion, useGetDashboardSummary, useGetTargetedTraining, useHealthCheck, useImportAdminQuestions, useListAdminQuestions, useListPracticeSets, useSubmitTrainingDrill } from "@workspace/api-client-react";
import type { AdminQuestion } from "@workspace/api-client-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Paywall, Waitlist } from "@/components/paywall";
import { ProgressPage } from "@/components/progress-page";
import { AdminAccess } from "@/components/admin-access";
import { LearnerFlow } from "@/components/learner-flow";

const queryClient = new QueryClient();

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/practice", label: "Practice", icon: Target },
  { href: "/training", label: "Targeted training", icon: Sparkles },
  { href: "/library", label: "Library", icon: BookOpen },
];

function AppButton({ children, onClick, href, kind = "dark", disabled = false, className = "", testId = "button-action" }: { children: React.ReactNode; onClick?: () => void; href?: string; kind?: "dark" | "yellow" | "ghost" | "outline"; disabled?: boolean; className?: string; testId?: string }) {
  const styles = { dark: "bg-[#252a40] text-[#fffaf0] hover:bg-[#353c5a]", yellow: "bg-[#f7c948] text-[#252a40] hover:bg-[#f9d86f]", ghost: "text-[#252a40] hover:bg-[#ebe6d9]", outline: "border border-[#cfc8bb] text-[#252a40] hover:border-[#252a40]" };
  const content = <span className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold ${styles[kind]} ${disabled ? "cursor-not-allowed opacity-45" : ""} ${className}`}>{children}</span>;
  if (href) return <Link href={href} data-testid={testId} aria-disabled={disabled} onClick={disabled ? (event) => event.preventDefault() : undefined}>{content}</Link>;
  return <button type="button" onClick={onClick} disabled={disabled} data-testid={testId}>{content}</button>;
}

function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className="flex items-center gap-2" data-testid="link-brand"><span className={`grid h-8 w-8 place-items-center rounded-sm ${light ? "bg-[#f7c948]" : "bg-[#252a40]"}`}><span className={`h-3 w-3 rotate-45 rounded-[2px] ${light ? "bg-[#252a40]" : "bg-[#f7c948]"}`} /></span><span className={`font-semibold tracking-[-.03em] ${light ? "text-[#fffaf0]" : "text-[#252a40]"}`}>pattern<span className={light ? "text-[#f7c948]" : "text-[#ad762c]"}>pilot</span></span></Link>;
}

function MarketingHeader() {
  return <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8"><Brand /><nav className="hidden items-center gap-7 text-sm text-[#676577] md:flex"><Link href="/practice" data-testid="link-nav-practice">Practice</Link><Link href="/library" data-testid="link-nav-library">Library</Link><a href="#method" data-testid="link-nav-method">The method</a></nav><div className="flex items-center gap-3"><AppButton href="/login" kind="ghost" testId="link-login">Log in</AppButton><AppButton href="/practice" kind="dark" className="hidden sm:inline-flex" testId="link-start-practice">Start free</AppButton></div></header>;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="pp-grain min-h-[100dvh] bg-[#f5f0e6] text-[#252a40]"><aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#252a40] px-5 py-6 text-[#fffaf0] transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}><div className="flex items-center justify-between"><Brand light /><button className="lg:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X size={20} /></button></div><div className="mt-12 space-y-1">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-sidebar-${label.toLowerCase().replaceAll(" ", "-")}`} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${location === href ? "bg-[#39415f] text-[#f7c948]" : "text-[#b7b7c1] hover:bg-[#303650] hover:text-[#fffaf0]"}`}><Icon size={17} strokeWidth={1.8} />{label}</Link>)}</div><div className="absolute bottom-7 left-5 right-5 border-t border-[#41465d] pt-5"><Link href="/unlock" className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#b7b7c1] hover:text-[#f7c948]" data-testid="link-sidebar-unlock"><LockKeyhole size={17} />Unlock full access</Link></div></aside>{mobileOpen && <button className="fixed inset-0 z-30 bg-[#252a40]/30 lg:hidden" onClick={() => setMobileOpen(false)} data-testid="button-overlay-menu" aria-label="Close menu" /> }<main className="min-h-[100dvh] lg:pl-64"><div className="flex items-center justify-between border-b border-[#ddd6c9] px-5 py-4 lg:hidden"><button onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu size={21} /></button><Brand /><div className="w-6" /></div>{children}</main></div>;
}

function LoadingBlock({ label = "Loading your practice space" }: { label?: string }) { return <div className="mx-auto max-w-5xl px-5 py-12"><div className="h-8 w-56 animate-pulse rounded bg-[#e5decf]" /><div className="mt-3 h-4 w-80 animate-pulse rounded bg-[#e5decf]" /><div className="mt-10 grid gap-4 md:grid-cols-3"><div className="h-36 animate-pulse rounded-lg bg-[#e5decf]" /><div className="h-36 animate-pulse rounded-lg bg-[#e5decf]" /><div className="h-36 animate-pulse rounded-lg bg-[#e5decf]" /></div><p className="sr-only">{label}</p></div>; }
function ErrorBlock({ retry }: { retry?: () => void }) { return <div className="mx-auto max-w-xl px-5 py-24 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f7c948]/30"><CircleHelp size={22} /></div><h2 className="mt-5 font-serif text-3xl">A small pause.</h2><p className="mt-2 text-[#676577]">We could not load this view. Your progress is safe — try again.</p>{retry && <AppButton kind="outline" onClick={retry} className="mt-6" testId="button-retry"><RefreshCw size={15} />Try again</AppButton>}</div>; }
function SectionKicker({ children }: { children: React.ReactNode }) { return <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#ad762c]"><span className="h-px w-6 bg-[#ad762c]" />{children}</div>; }

function Landing() { return <LandingPage />; }

function Practice() { return <LearnerFlow />; }

function Results() { return <LearnerFlow />; }

function Training() { return <TrainingFlow />; }

function Dashboard() { return <ProgressPage />; }

function Library() {
  const { data, isLoading } = useListPracticeSets();
  const sets = data ?? [];
  return <AppShell><div className="mx-auto max-w-5xl px-5 py-10 lg:px-10 lg:py-14"><SectionKicker>Practice library</SectionKicker><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h1 className="font-serif text-5xl tracking-[-.03em]">Passages with a point.</h1><p className="mt-3 text-sm text-[#676577]">Pick a topic. We will help you read the pattern in your answers.</p></div><div className="relative"><Search size={15} className="absolute left-3 top-3 text-[#676577]" /><input placeholder="Search passages" className="w-full rounded-md border border-[#cfc8bb] bg-[#fffaf0] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#ad762c] sm:w-52" data-testid="input-search-library" /></div></div>{isLoading ? <LoadingBlock label="Loading library" /> : <div className="mt-10 divide-y divide-[#ddd6c9] border-y border-[#ddd6c9]">{sets.map((set, i) => <div key={set.id} className="grid gap-4 py-6 sm:grid-cols-[60px_1fr_auto] sm:items-center"><span className="font-mono text-xs text-[#ad762c]">0{i + 1}</span><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-semibold">{set.title}</h2><span className="rounded-full bg-[#ebe6d9] px-2 py-1 text-[10px] text-[#676577]">{set.difficulty}</span></div><p className="mt-1 text-sm text-[#676577]">{set.topic} · {set.blankCount} words</p></div><AppButton href="/practice" kind="outline" testId={`link-library-set-${set.id}`}>Open set <ChevronRight size={15} /></AppButton></div>)}</div>}</div></AppShell>;
}

function Unlock() { return <Paywall/>; }

function Login() {
  const [, navigate] = useLocation(); const [email, setEmail] = useState(""); const [submitted, setSubmitted] = useState(false);
  return <div className="min-h-[100dvh] bg-[#f5f0e6] px-5 py-6"><Brand /><div className="mx-auto flex max-w-md flex-col justify-center py-20"><SectionKicker>Welcome back</SectionKicker><h1 className="font-serif text-5xl tracking-[-.03em]">Pick up the thread.</h1>{submitted ? <div className="mt-8 rounded-lg bg-[#ebe6d9] p-6"><Check size={19} className="text-[#ad762c]" /><p className="mt-4 text-sm leading-6">A sign-in link is ready for {email}. This preview will take you to your overview.</p><AppButton onClick={() => navigate("/dashboard")} kind="dark" className="mt-6" testId="button-login-continue">Continue to overview <ArrowRight size={15} /></AppButton></div> : <form className="mt-8" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}><label className="text-xs font-semibold">University email<input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@university.edu" className="mt-2 w-full rounded-md border border-[#cfc8bb] bg-[#fffaf0] px-3 py-3 text-sm outline-none focus:border-[#ad762c]" data-testid="input-login-email" /></label><button className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-[#252a40] px-4 py-3 text-sm font-semibold text-[#fffaf0] hover:bg-[#353c5a]" data-testid="button-login-submit">Send me a sign-in link <ArrowRight size={15} /></button><p className="mt-4 text-center text-xs text-[#676577]">No password to remember. Just your work.</p></form>}<Link href="/practice" className="mt-10 text-center text-sm text-[#ad762c] underline underline-offset-4" data-testid="link-login-practice">Or practice free without signing in</Link></div></div>;
}

function AdminQuestions() {
  return <AdminAccess>{secret => <AdminQuestionEditor secret={secret} />}</AdminAccess>;
}

function AdminQuestionEditor({ secret }: { secret: string }) {
  const request = { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" as const };
  const queryClient = useQueryClient(); const { data, isLoading, isError, refetch } = useListAdminQuestions(undefined, { request }); const create = useCreateAdminQuestion({ request }); const imp = useImportAdminQuestions({ request });
  const [search, setSearch] = useState(""); const [showCreate, setShowCreate] = useState(false); const [raw, setRaw] = useState(""); const [format, setFormat] = useState<"json" | "csv">("json"); const [title, setTitle] = useState(""); const [topic, setTopic] = useState(""); const [message, setMessage] = useState("");
  const questions = (data || []) as AdminQuestion[];
  const saveQuestion = () => { create.mutate({ data: { title, topic, difficulty: "Foundational", passage: "New question awaiting editorial review.", blanks: [], published: false, sourceLabel: "PatternPilot studio" } }, { onSuccess: () => { setTitle(""); setTopic(""); setShowCreate(false); setMessage("Question drafted."); queryClient.invalidateQueries({ queryKey: getListAdminQuestionsQueryKey() }); }, onError: () => setMessage("Could not create this question.") }); };
  const importQuestions = () => imp.mutate({ data: { format, raw } }, { onSuccess: (result) => { setMessage(result.message); setRaw(""); queryClient.invalidateQueries({ queryKey: getListAdminQuestionsQueryKey() }); }, onError: () => setMessage("Import could not be read.") });
  if (isError) return <AppShell><ErrorBlock retry={refetch} /></AppShell>;
  return <AppShell><div className="mx-auto max-w-6xl px-5 py-10 lg:px-10 lg:py-14"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><SectionKicker>Question studio / admin</SectionKicker><h1 className="font-serif text-5xl tracking-[-.03em]">Keep the bank sharp.</h1><p className="mt-3 text-sm text-[#676577]">Draft, publish, and import the passages behind every useful diagnosis.</p></div><AppButton onClick={() => setShowCreate((v) => !v)} kind="yellow" testId="button-new-question"><Plus size={16} />New question</AppButton></div>{message && <div className="mt-6 flex items-center justify-between rounded-md bg-[#ebe6d9] px-4 py-3 text-sm" data-testid="status-admin-message">{message}<button onClick={() => setMessage("")} data-testid="button-dismiss-admin-message"><X size={15} /></button></div>}{showCreate && <div className="mt-7 grid gap-4 rounded-lg border border-[#ddd6c9] bg-[#fffaf0] p-6 sm:grid-cols-2"><label className="text-xs font-semibold">Question title<input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-md border border-[#cfc8bb] bg-transparent px-3 py-2.5 text-sm" data-testid="input-admin-title" /></label><label className="text-xs font-semibold">Topic<input value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-2 w-full rounded-md border border-[#cfc8bb] bg-transparent px-3 py-2.5 text-sm" data-testid="input-admin-topic" /></label><div className="flex gap-3 sm:col-span-2"><AppButton onClick={saveQuestion} kind="dark" disabled={!title || !topic || create.isPending} testId="button-save-question">Save draft</AppButton><AppButton onClick={() => setShowCreate(false)} kind="ghost" testId="button-cancel-question">Cancel</AppButton></div></div>}<div className="mt-8 grid gap-5 lg:grid-cols-[1fr_310px]"><div><div className="mb-4 flex items-center gap-3"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-3 text-[#676577]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search question bank" className="w-full rounded-md border border-[#cfc8bb] bg-[#fffaf0] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#ad762c]" data-testid="input-admin-search" /></div><button onClick={() => refetch()} className="rounded-md border border-[#cfc8bb] p-2.5 hover:bg-[#ebe6d9]" data-testid="button-refresh-questions"><RefreshCw size={16} /></button></div>{isLoading ? <LoadingBlock label="Loading question bank" /> : <div className="divide-y divide-[#ddd6c9] border-y border-[#ddd6c9]">{questions.filter((q) => q.title.toLowerCase().includes(search.toLowerCase())).map((q) => <div key={q.id} className="flex items-center justify-between gap-4 py-5" data-testid={`row-question-${q.id}`}><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{q.title}</h2><span className={`rounded-full px-2 py-1 text-[10px] ${q.published ? "bg-[#d8e6df] text-[#316956]" : "bg-[#ebe6d9] text-[#676577]"}`}>{q.published ? "Published" : "Draft"}</span></div><p className="mt-1 text-xs text-[#676577]">{q.topic} · {q.sourceLabel}</p></div><span className="font-mono text-[10px] text-[#676577]">{new Date(q.updatedAt).toLocaleDateString()}</span></div>)}{questions.length === 0 && <div className="py-16 text-center"><FileText className="mx-auto text-[#ad762c]" size={24} /><p className="mt-4 text-sm text-[#676577]">No questions yet. Draft the first passage or import a set.</p></div>}</div>}</div><div className="rounded-lg bg-[#252a40] p-6 text-[#fffaf0]"><div className="flex items-center justify-between"><SectionKicker><span className="text-[#f7c948]">Import surface</span></SectionKicker><FileJson size={18} className="text-[#f7c948]" /></div><p className="mt-1 text-sm leading-6 text-[#c7c6ce]">Paste JSON or CSV-shaped rows. We will validate before adding them to the bank.</p><div className="mt-5 flex gap-2"><button onClick={() => setFormat("json")} className={`rounded px-2.5 py-1 text-xs ${format === "json" ? "bg-[#f7c948] text-[#252a40]" : "bg-[#39415f] text-[#c7c6ce]"}`} data-testid="button-import-json">JSON</button><button onClick={() => setFormat("csv")} className={`rounded px-2.5 py-1 text-xs ${format === "csv" ? "bg-[#f7c948] text-[#252a40]" : "bg-[#39415f] text-[#c7c6ce]"}`} data-testid="button-import-csv">CSV</button></div><textarea value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={format === "json" ? '[{"title":"..."}]' : "title,topic,difficulty,..."} className="mt-4 h-40 w-full resize-none rounded-md border border-[#4a4f68] bg-[#303650] p-3 font-mono text-xs text-[#fffaf0] outline-none focus:border-[#f7c948]" data-testid="textarea-import-questions" /><AppButton onClick={importQuestions} kind="yellow" disabled={!raw || imp.isPending} className="mt-4 w-full" testId="button-import-questions"><Upload size={15} />{imp.isPending ? "Importing…" : "Import questions"}</AppButton></div></div></div></AppShell>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Landing} /><Route path="/practice" component={Practice} /><Route path="/results" component={Results} /><Route path="/training" component={Training} /><Route path="/unlock" component={Unlock} /><Route path="/waitlist" component={Waitlist} /><Route path="/dashboard" component={Dashboard} /><Route path="/library" component={Library} /><Route path="/login" component={Login} /><Route path="/admin/questions" component={AdminQuestions} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function AppContent() {
  useHealthCheck({ query: { queryKey: ["/api/healthz"], retry: false } });
  return <TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter><Toaster /></TooltipProvider>;
}

function App() {
  return <QueryClientProvider client={queryClient}><AppContent /></QueryClientProvider>;
}

export default App;
