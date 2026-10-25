import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Bot, ChevronDown } from "lucide-react";
import { meta } from "@/components/Brand";
import { ClubDot } from "@/components/demo-ui";
import { useDemo } from "@/lib/demo-store";
import { BUDGET, CLUBS, conflicts, current, EVENT, fmtRange, propose, REQUIRED, t, userById } from "@/lib/domain";

export const Route = createFileRoute("/demo/")({
  head: () => ({ meta: meta("Step 1: The plan — CoHost demo", "Three campus clubs co-host Hack Night. See the plan their agents worked out.") }),
  component: Plan,
});

const KIND: Record<string, string> = { proposal: "Proposed", offer: "Offered", constraint: "Flagged a problem", counteroffer: "Suggested a fix", note: "Changed the plan" };

function Plan() {
  const { s, run } = useDemo();
  const v = current(s);
  const me = userById(s.currentUserId)!;
  const problems = conflicts(v);
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="eyebrow text-primary">Step 1 of 3 · The plan</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">{EVENT.title}: {EVENT.tagline.toLowerCase()}</h1>
        <p className="mt-3 text-muted-foreground">
          Three clubs want to run this together. Each club’s AI agent knows what its club can offer. The agents talked it through and wrote one shared plan. Nothing is final until a leader from each club approves it.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <section className="panel" aria-labelledby="chat-title">
          <div className="flex items-center gap-2"><Bot size={18} className="text-primary" aria-hidden="true" /><h2 id="chat-title" className="font-display text-lg font-bold">How the agents got there</h2></div>
          <ol className="mt-5 space-y-4">
            {s.messages.map((m, i) => (
              <li key={m.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                  {i < s.messages.length - 1 && <span aria-hidden="true" className="mt-1 w-px flex-1 bg-border" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm"><ClubDot club={m.club} /><strong>{CLUBS[m.club].name} {m.deterministic ? "agent" : "leader"}</strong><span className={`badge ${m.kind === "constraint" ? "badge-pending" : "badge-muted"}`}>{KIND[m.kind]}</span></p>
                  <p className="mt-2 rounded-2xl rounded-tl-sm border border-border bg-muted/50 px-4 py-3 text-sm leading-6">{m.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel h-fit lg:sticky lg:top-44" aria-labelledby="plan-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="plan-title" className="font-display text-lg font-bold">The shared plan</h2>
            <span className="badge badge-muted">Version {v.version}</span>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">When</dt><dd className="text-right font-semibold">{EVENT.when}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Design workshop</dt><dd className={`text-right font-semibold ${problems.length ? "text-destructive" : ""}`}>{fmtRange(v.workshop)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Budget needed</dt><dd className="text-right font-semibold">${BUDGET} for pizza and prizes</dd></div>
          </dl>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Who brings what</h3>
          <ul className="mt-3 space-y-3">
            {REQUIRED.map((c) => (
              <li key={c} className="flex gap-3 rounded-xl border border-border p-3 text-sm"><ClubDot club={c} /><span><strong className="block">{CLUBS[c].name}</strong><span className="text-muted-foreground">{v.contributions[c]}</span></span></li>
            ))}
          </ul>
          {problems.map((p) => (
            <p key={p} role="alert" className="mt-4 flex gap-2 rounded-xl bg-pending px-3 py-3 text-sm text-pending-foreground"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{p}</p>
          ))}
          <Link to="/demo/approvals" className="btn btn-primary mt-6 w-full py-3">Looks good, get approvals <ArrowRight size={16} /></Link>
        </section>
      </div>

      <details className="panel group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
          Try changing the plan
          <ChevronDown size={18} className="transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
        </summary>
        <p className="mt-3 text-sm text-muted-foreground">Any change makes a new version and clears earlier approvals, so nobody ends up agreeing to something they didn’t see. Only club leaders can change the plan{me.leader ? "" : `, so switch to Maya, Leo or Jordan first`}.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn btn-ghost" disabled={!me.leader || s.published} onClick={() => run((st) => propose(st, me.id, { workshop: [t(18), t(18, 45)] }, "Moved the design workshop back to 6:00 PM"))}>Move the workshop back to 6:00 PM</button>
          <button className="btn btn-ghost" disabled={!me.leader || s.published} onClick={() => run((st) => propose(st, me.id, { workshop: [t(18, 30), t(19, 15)] }, "Moved the design workshop to 6:30 PM"))}>Move it to 6:30 PM</button>
          <button className="btn btn-ghost" disabled={!me.leader || s.published} onClick={() => run((st) => propose(st, me.id, { contributions: { ...current(st).contributions, coding: "Runs the event, 6 mentors, $100" } }, "Coding Club will bring 6 mentors instead of 4"))}>Bring 6 mentors instead of 4</button>
        </div>
      </details>
    </div>
  );
}
