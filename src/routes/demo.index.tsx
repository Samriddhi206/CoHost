import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Bot, ChevronDown } from "lucide-react";
import { meta } from "@/components/Brand";
import { Avatar, ClubDot } from "@/components/demo-ui";
import { MembersOnlySeeBasics } from "@/components/demo-locked";
import { useDemo } from "@/lib/demo-store";
import { canSeePlan, CLUBS, conflicts, current, def, ev, fmtRange, isOfficer, propose, roster, t, titleIn, userById } from "@/lib/domain";

export const Route = createFileRoute("/demo/")({
  head: () => ({ meta: meta("Step 1: The plan — CoHost demo", "Campus clubs co-host events. See the plan their agents worked out, club by club.") }),
  component: Plan,
});

const KIND: Record<string, string> = { proposal: "Proposed", offer: "Offered", constraint: "Flagged a problem", counteroffer: "Suggested a fix", note: "Changed the plan" };

function Plan() {
  const { s, run } = useDemo();
  const me = userById(s.currentUserId)!;
  const d = def(s);
  if (!canSeePlan(s, me)) return (
    <div className="space-y-6">
      <Heading />
      <MembersOnlySeeBasics what="the plan" />
    </div>
  );
  const v = current(s);
  const problems = conflicts(s);
  return (
    <div className="space-y-8">
      <Heading />
      {problems.map((p) => <p key={p} role="alert" className="flex gap-2 rounded-xl bg-pending px-4 py-3 text-sm text-pending-foreground"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{p}</p>)}

      <section aria-labelledby="plan-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="plan-title" className="font-display text-xl font-bold">Who brings what</h2>
          <p className="text-sm text-muted-foreground">Version {v.version} · ${d.budget} budget · {d.session} {fmtRange(v.workshop)}</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {d.clubs.map((c) => (
            <article key={c} className="panel panel-lift flex flex-col">
              <p className="flex items-center gap-2 font-display text-lg font-bold"><ClubDot club={c} />{CLUBS[c].name}{c === d.organizer && <span className="badge badge-muted ml-auto">Organizer</span>}</p>
              <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-sm">{v.contributions[c]}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {roster(c).map((u) => (
                  <li key={u.id} className={`flex items-center gap-2 ${isOfficer(u, c) ? "" : "text-muted-foreground"}`}><Avatar id={u.id} club={c} />{u.name} <span className="text-muted-foreground">({titleIn(u, c)})</span></li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="chat-title">
        <div className="flex items-center gap-2"><Bot size={18} className="text-primary" aria-hidden="true" /><h2 id="chat-title" className="font-display text-lg font-bold">How the agents got there</h2></div>
        <ol className="mt-5 space-y-4">
          {ev(s).messages.map((m, i, all) => (
            <li key={m.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                {i < all.length - 1 && <span aria-hidden="true" className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <p className="flex flex-wrap items-center gap-2 text-sm"><ClubDot club={m.club} /><strong>{CLUBS[m.club].name} {m.deterministic ? "agent" : "officer"}</strong><span className={`badge ${m.kind === "constraint" ? "badge-pending" : "badge-muted"}`}>{KIND[m.kind]}</span></p>
                <p className="mt-2 rounded-2xl rounded-tl-sm border border-border bg-muted/50 px-4 py-3 text-sm leading-6">{m.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link to="/demo/approvals" className="btn btn-primary mt-6">Looks good, get approvals <ArrowRight size={16} /></Link>
      </section>

      {d.id === "hack-night" && (
        <details className="panel group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            Try changing the plan
            <ChevronDown size={18} className="transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="mt-3 text-sm text-muted-foreground">Any change makes a new version and clears earlier approvals, so nobody agrees to something they didn’t see.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="btn btn-ghost" disabled={ev(s).published} onClick={() => run((st) => propose(st, me.id, { workshop: [t(18), t(18, 45)] }, "Moved the design workshop back to 6:00 PM"))}>Move the workshop back to 6:00 PM</button>
            <button className="btn btn-ghost" disabled={ev(s).published} onClick={() => run((st) => propose(st, me.id, { workshop: [t(18, 30), t(19, 15)] }, "Moved the design workshop to 6:30 PM"))}>Move it to 6:30 PM</button>
            <button className="btn btn-ghost" disabled={ev(s).published} onClick={() => run((st) => propose(st, me.id, { contributions: { ...current(st).contributions, coding: "Organizes, brings 6 mentors and $100" } }, "Coding Club will bring 6 mentors instead of 4"))}>Bring 6 mentors instead of 4</button>
          </div>
        </details>
      )}
    </div>
  );
}

function Heading() {
  return (
    <div className="max-w-3xl">
      <p className="eyebrow text-primary">Step 1 of 3 · The plan</p>
      <h2 className="mt-2 font-display text-3xl font-extrabold">What the clubs’ agents agreed</h2>
      <p className="mt-3 text-muted-foreground">Each club’s AI agent knows what its club can offer. The agents talked it through and wrote one shared plan. Nothing is final until an officer from every club approves it.</p>
    </div>
  );
}
