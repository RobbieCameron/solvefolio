"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Code2,
  Gauge,
  LogOut,
  MessageSquareText,
  Sparkles,
  Target,
  Trophy
} from "lucide-react";
import clsx from "clsx";
import type { Flashcard, InterviewFeedback, MockInterview, Note, Problem } from "@/lib/types";

type SessionUser = { id: string; email: string; name: string };
type Workspace = { problems: Problem[]; notes: Note[]; flashcards: Flashcard[]; feedback: InterviewFeedback[]; mocks: MockInterview[] };

const emptyWorkspace: Workspace = { problems: [], notes: [], flashcards: [], feedback: [], mocks: [] };

export default function Home() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [coachState, setCoachState] = useState<"idle" | "processing">("idle");

  const visibleProblems = workspace.problems;
  const selectedProblem = visibleProblems.find((problem) => problem.id === selectedProblemId) ?? visibleProblems[0] ?? workspace.problems[0];
  const latestFeedback = workspace.feedback[0];
  const selectedFeedback = selectedProblem ? workspace.feedback.find((item) => item.problemId === selectedProblem.id) : latestFeedback;
  const previousFeedback = latestFeedback
    ? workspace.feedback.filter((item) => item.problemId === latestFeedback.problemId && item.id !== latestFeedback.id)[0]
    : undefined;

  const proofStats = useMemo(() => {
    const reports = workspace.feedback.length;
    const averageScore = reports ? Math.round(workspace.feedback.reduce((sum, item) => sum + item.score, 0) / reports) : 0;
    const topicScores = new Map<string, { total: number; count: number }>();

    workspace.feedback.forEach((item) => {
      const problem = workspace.problems.find((candidate) => candidate.id === item.problemId);
      if (!problem) return;
      const current = topicScores.get(problem.topic) ?? { total: 0, count: 0 };
      current.total += item.score;
      current.count += 1;
      topicScores.set(problem.topic, current);
    });

    const strongestTopic = Array.from(topicScores.entries())
      .map(([topic, value]) => ({ topic, score: Math.round(value.total / value.count) }))
      .sort((a, b) => b.score - a.score)[0];

    return {
      reports,
      averageScore,
      strongestTopic: strongestTopic?.topic ?? "Not proven yet",
      readiness: reports ? Math.min(96, Math.round(averageScore * 0.72 + Math.min(24, reports * 6))) : 0
    };
  }, [workspace.feedback, workspace.problems]);

  async function refresh() {
    const workspaceResponse = await fetch("/api/workspace");
    if (workspaceResponse.ok) setWorkspace(await workspaceResponse.json());
  }

  useEffect(() => {
    async function boot() {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      setUser(data.user);
      if (data.user) await refresh();
      setLoading(false);
    }

    boot();
  }, []);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${authMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries()))
    });
    const data = await response.json();
    if (!response.ok) {
      setNotice(data.error);
      return;
    }
    setUser(data.user);
    setNotice("");
    await refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setWorkspace(emptyWorkspace);
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProblem) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setCoachState("processing");
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId: selectedProblem.id, ...Object.fromEntries(form.entries()) })
    });
    const data = await response.json();
    setCoachState("idle");

    if (response.ok) {
      setNotice(`Coach report generated: ${data.feedback.score}/100.`);
      formElement.reset();
      await refresh();
    } else {
      setNotice(data.error);
    }
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center text-ink">Loading Solvefolio...</main>;
  }

  if (!user) {
    return (
      <main className="min-h-screen px-5 py-8 md:px-10">
        <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex min-h-[82vh] flex-col justify-between rounded-lg bg-ink p-8 text-white shadow-soft">
            <div>
              <div className="mb-12 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-lemon text-ink">
                  <Brain size={24} />
                </div>
                <span className="text-xl font-semibold">Solvefolio</span>
              </div>
              <h1 className="max-w-2xl text-5xl font-semibold leading-tight md:text-7xl">A portfolio for technical problem solving.</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
                Submit a real interview solution. Get a scored coach report. Build evidence recruiters can actually inspect.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["4", "scored dimensions"],
                ["1", "proof card"],
                ["0", "placeholder widgets"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-white/20 bg-white/10 p-4">
                  <div className="text-3xl font-semibold">{value}</div>
                  <div className="mt-1 text-sm text-white/60">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAuth} className="self-center rounded-lg bg-white p-6 shadow-soft">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-coral">Coach studio</p>
              <h2 className="mt-2 text-3xl font-semibold">{authMode === "signup" ? "Create your solvefolio" : "Open your solvefolio"}</h2>
            </div>
            <div className="grid gap-4">
              {authMode === "signup" && (
                <label className="grid gap-2 text-sm font-medium">
                  Name
                  <input className="focus-ring rounded-lg border border-ink/20 px-4 py-3" name="name" placeholder="Ada Lovelace" required />
                </label>
              )}
              <label className="grid gap-2 text-sm font-medium">
                Email
                <input className="focus-ring rounded-lg border border-ink/20 px-4 py-3" name="email" type="email" placeholder="ada@student.dev" required />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Password
                <input className="focus-ring rounded-lg border border-ink/20 px-4 py-3" name="password" type="password" minLength={8} placeholder="8+ characters" required />
              </label>
              <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-coral px-5 py-3 font-semibold text-white">
                <Sparkles size={18} /> {authMode === "signup" ? "Start building proof" : "Enter studio"}
              </button>
            </div>
            {notice && <p className="mt-4 text-sm font-medium text-coral">{notice}</p>}
            <button
              type="button"
              className="mt-5 text-sm font-semibold text-steel"
              onClick={() => {
                setAuthMode((mode) => (mode === "signup" ? "login" : "signup"));
                setNotice("");
              }}
            >
              {authMode === "signup" ? "Already have a solvefolio" : "Create a new solvefolio"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-5 text-ink md:px-8">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 pb-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-lemon">
            <Brain size={23} />
          </div>
          <div>
            <p className="text-sm text-ink/60">Solvefolio</p>
            <h1 className="text-2xl font-semibold">Interview Coach Studio</h1>
          </div>
        </div>
        <button onClick={logout} className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg border border-ink/20 bg-white px-4 text-sm font-semibold">
          <LogOut size={17} /> Sign out
        </button>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5">
        <section className="rounded-lg bg-ink p-6 text-white shadow-soft">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-lemon">One workflow, done well</p>
              <h2 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
                Turn a coding answer into a recruiter-facing proof card.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                Solvefolio grades correctness, complexity, communication, and edge-case thinking, then packages the result as evidence of how you reason.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricDark icon={<MessageSquareText size={18} />} label="Coach reports" value={proofStats.reports} />
              <MetricDark icon={<Gauge size={18} />} label="Avg score" value={proofStats.averageScore} suffix="/100" />
              <MetricDark icon={<Target size={18} />} label="Strongest topic" value={proofStats.strongestTopic} />
              <MetricDark icon={<Trophy size={18} />} label="Portfolio readiness" value={proofStats.readiness} suffix="%" />
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.25fr_0.95fr]">
          <aside className="rounded-lg bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded bg-paper text-steel">
                <Code2 size={18} />
              </div>
              <h2 className="text-xl font-semibold">Problem Library</h2>
            </div>
            <p className="mb-4 text-sm leading-6 text-ink/65">
              Canonical public interview problems. The value is not the list; it is the evidence you create after solving one.
            </p>
            <div className="grid gap-2">
              {visibleProblems.map((problem) => (
                <button
                  key={problem.id}
                  onClick={() => setSelectedProblemId(problem.id)}
                  className={clsx(
                    "focus-ring rounded-lg border p-3 text-left transition",
                    selectedProblem?.id === problem.id ? "border-ink bg-ink text-white" : "border-ink/10 bg-paper text-ink hover:border-steel/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{problem.title}</span>
                    <span className={clsx("rounded px-2 py-1 text-xs font-bold", selectedProblem?.id === problem.id ? "bg-white/10 text-white" : difficultyTone(problem.difficulty))}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className={clsx("mt-1 text-xs", selectedProblem?.id === problem.id ? "text-white/60" : "text-ink/60")}>{problem.topic}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-lg bg-white p-5 shadow-soft">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-coral">Input</p>
              <h2 className="mt-1 text-3xl font-semibold">{selectedProblem?.title ?? "Choose a problem"}</h2>
              {selectedProblem && <p className="mt-3 text-sm leading-6 text-ink/70">{selectedProblem.prompt}</p>}
            </div>

            <form onSubmit={submitFeedback} className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Your solution
                <textarea name="solution" className="focus-ring min-h-32 rounded-lg border border-ink/20 px-4 py-3 font-mono text-sm" placeholder="Describe the algorithm and key data structures..." required />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Complexity
                <textarea name="complexity" className="focus-ring min-h-20 rounded-lg border border-ink/20 px-4 py-3 text-sm" placeholder="Time O(...), space O(...), and why..." required />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Interview explanation
                <textarea name="explanation" className="focus-ring min-h-28 rounded-lg border border-ink/20 px-4 py-3 text-sm" placeholder="How you would talk through this with an interviewer..." required />
              </label>
              <button disabled={!selectedProblem || coachState === "processing"} className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-coral px-5 font-semibold text-white disabled:opacity-60">
                <Sparkles size={18} /> {coachState === "processing" ? "Scoring answer..." : "Generate coach report"}
              </button>
              {notice && <p className="text-sm font-medium text-coral">{notice}</p>}
            </form>
          </section>

          <aside className="grid gap-5">
            <section className="rounded-lg bg-white p-5 shadow-soft">
              <div className="mb-4 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded bg-paper text-steel">
                  <MessageSquareText size={18} />
                </div>
                <h2 className="text-xl font-semibold">Coach Report</h2>
              </div>
              {selectedFeedback ? (
                <div className="grid gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-5xl font-semibold">{selectedFeedback.score}<span className="text-2xl text-ink/45">/100</span></div>
                      <p className="mt-1 text-sm text-ink/60">{scoreBand(selectedFeedback)} · {percentileLabel(selectedFeedback)}</p>
                    </div>
                    <div className="rounded-lg bg-paper px-3 py-2 text-center">
                      <div className="text-lg font-semibold">{progressionText(selectedFeedback, previousFeedback)}</div>
                      <div className="text-xs text-ink/55">progression</div>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-ink/70">{selectedFeedback.summary}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Score label="Correctness" value={selectedFeedback.correctness} />
                    <Score label="Complexity" value={selectedFeedback.timeComplexity} />
                    <Score label="Communication" value={selectedFeedback.communication} />
                    <Score label="Edge cases" value={selectedFeedback.edgeCases} />
                  </div>
                  <div className="rounded-lg bg-paper p-4">
                    <p className="text-sm font-semibold">Coaching focus</p>
                    <ul className="mt-2 grid gap-2 text-sm leading-5 text-ink/70">
                      {(selectedFeedback.missingEdgeCases.length ? selectedFeedback.missingEdgeCases : ["Add one adversarial test and one follow-up optimization."]).map((item) => (
                        <li key={item} className="flex gap-2">
                          <ArrowRight className="mt-0.5 shrink-0 text-coral" size={15} /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <EmptyReport />
              )}
            </section>

            <section className="rounded-lg bg-white p-5 shadow-soft">
              <div className="mb-4 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded bg-paper text-steel">
                  <Trophy size={18} />
                </div>
                <h2 className="text-xl font-semibold">Recruiter Proof Card</h2>
              </div>
              {latestFeedback ? (
                <div className="rounded-lg border border-ink/10 bg-paper p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-ink/60">{user.name}</p>
                      <h3 className="mt-1 text-xl font-semibold">{problemTitle(workspace.problems, latestFeedback.problemId)}</h3>
                    </div>
                    <div className="rounded-lg bg-white px-3 py-2 text-center">
                      <div className="text-2xl font-semibold">{latestFeedback.score}<span className="text-sm text-ink/45">/100</span></div>
                      <div className="text-xs text-ink/60">{scoreBand(latestFeedback)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge label={percentileLabel(latestFeedback)} />
                    <Badge label={progressionText(latestFeedback, previousFeedback)} />
                    <Badge label={`${latestFeedback.communication} communication`} />
                  </div>
                  <p className="mt-4 text-sm font-semibold">Evidence</p>
                  <div className="mt-3 grid gap-3">
                    {evidenceStrengths(latestFeedback).map((item) => (
                      <EvidenceRow key={item} tone="good" text={item} />
                    ))}
                    {evidenceGaps(latestFeedback).map((item) => (
                      <EvidenceRow key={item} tone="warn" text={item} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6 text-ink/70">Generate one coach report to create the first portfolio artifact.</p>
              )}
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}

function MetricDark({ icon, label, value, suffix = "" }: { icon: React.ReactNode; label: string; value: string | number; suffix?: string }) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/10 p-4">
      <div className="mb-2 grid h-8 w-8 place-items-center rounded bg-white/10 text-lemon">{icon}</div>
      <div className="text-2xl font-semibold">{value}{suffix}</div>
      <div className="mt-1 text-xs text-white/60">{label}</div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-paper p-3">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs text-ink/60">{label}</div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded bg-white px-2 py-2 text-center font-semibold text-ink/70">{label}</span>;
}

function EvidenceRow({ tone, text }: { tone: "good" | "warn"; text: string }) {
  const Icon = tone === "good" ? CheckCircle2 : AlertTriangle;
  return (
    <div className="flex gap-3 rounded-lg bg-white p-3 text-sm leading-5 text-ink/72">
      <Icon className={clsx("mt-0.5 shrink-0", tone === "good" ? "text-moss" : "text-coral")} size={17} />
      <span>{text}</span>
    </div>
  );
}

function EmptyReport() {
  return (
    <div className="grid gap-4">
      {[
        ["Input", "Paste a solution, complexity, and spoken explanation."],
        ["Processing", "The coach checks algorithm signals, clarity, and edge-case coverage."],
        ["Output", "You get a scored report plus a proof card for your solvefolio."]
      ].map(([title, body]) => (
        <div key={title} className="rounded-lg bg-paper p-4">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-5 text-ink/70">{body}</p>
        </div>
      ))}
    </div>
  );
}

function problemTitle(problems: Problem[], problemId: string) {
  return problems.find((problem) => problem.id === problemId)?.title ?? "Coach report";
}

function evidenceStrengths(feedback: InterviewFeedback) {
  return feedback.evidenceStrengths?.length
    ? feedback.evidenceStrengths
    : ["Submitted a complete solution, complexity analysis, and interviewer explanation."];
}

function evidenceGaps(feedback: InterviewFeedback) {
  if (feedback.evidenceGaps?.length) return feedback.evidenceGaps;
  if (feedback.missingEdgeCases.length) return feedback.missingEdgeCases.map((item) => `Limited coverage: ${item}.`);
  return ["Add one adversarial test and one follow-up optimization."];
}

function scoreBand(feedback: InterviewFeedback) {
  if (feedback.scoreBand) return feedback.scoreBand;
  if (feedback.score >= 90) return "Excellent";
  if (feedback.score >= 80) return "Strong";
  if (feedback.score >= 70) return "Promising";
  if (feedback.score >= 60) return "Developing";
  return "Needs work";
}

function percentileLabel(feedback: InterviewFeedback) {
  if (feedback.percentileLabel) return feedback.percentileLabel;
  if (feedback.score >= 90) return "Top 10% signal";
  if (feedback.score >= 80) return "Top 20% signal";
  if (feedback.score >= 70) return "Top 35% signal";
  if (feedback.score >= 60) return "Practice-ready";
  return "Early attempt";
}

function progressionText(current: InterviewFeedback, previous?: InterviewFeedback) {
  if (!previous) return "First scored attempt";
  const diff = current.score - previous.score;
  if (diff > 0) return `+${diff} improvement`;
  if (diff < 0) return `${diff} regression`;
  return "No score change";
}

function difficultyTone(difficulty: Problem["difficulty"]) {
  return {
    EASY: "bg-moss/10 text-moss",
    MEDIUM: "bg-lemon/30 text-ink",
    HARD: "bg-coral/10 text-coral"
  }[difficulty];
}
