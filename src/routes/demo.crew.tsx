import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, Sparkles, UserRound } from "lucide-react";
import { meta } from "@/components/Brand";
import { Avatar } from "@/components/demo-ui";
import { useDemo } from "@/lib/demo-store";
import { cancelSignup, CLUBS, confirmedFor, confirmSignup, def, eligibility, ev, fmt, inEvent, rank, recommend, titleIn, userById, type DemoUser, type State } from "@/lib/domain";

export const Route = createFileRoute("/demo/crew")({
  head: () => ({ meta: meta("Step 3: Volunteers — CoHost demo", "Club members see shifts that fit their schedule and skills, and sign up themselves.") }),
  component: Crew,
});

// "Ava (Budget officer, Coding Club)": a person's most senior role among this event's clubs.
function who(s: State, u: DemoUser) {
  const m = u.clubs.filter((x) => def(s).clubs.includes(x.club)).sort((a, b) => rank(a.title) - rank(b.title))[0];
  return m ? `${u.name} (${m.title}, ${CLUBS[m.club].short})` : u.name;
}

function Crew() {
  const { s, run, setUser } = useDemo();
  const me = userById(s.currentUserId)!;
  const e = ev(s);
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="eyebrow text-primary">Step 3 of 3 · Volunteers</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold">Members pick the shifts that fit them</h2>
        <p className="mt-3 text-muted-foreground">Anyone in a host club can volunteer, members and officers alike. The agents suggest who fits each shift by free time and skills, but nobody is signed up for them.</p>
      </div>

      {!e.published && (
        <div className="panel flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Shifts open once every club approves the plan and the organizer opens sign-ups.</p>
          <Link to="/demo/approvals" className="btn btn-primary">Go to step 2</Link>
        </div>
      )}
      {!inEvent(s, me) && <p className="rounded-xl bg-pending px-4 py-3 text-sm text-pending-foreground">{me.name} isn’t in any of this event’s clubs, so they can’t volunteer here.</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {e.roles.map((r) => {
          const conf = confirmedFor(s, r.id);
          const mine = conf.some((x) => x.userId === me.id);
          const why = eligibility(s, me.id, r);
          const recs = recommend(s, r).filter((u) => u.id !== me.id);
          const full = conf.length >= r.capacity;
          return (
            <article key={r.id} className="panel panel-lift flex flex-col">
              <h3 className="font-display text-lg font-bold">{r.title}</h3>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock size={14} aria-hidden="true" />{fmt(r.start)}–{fmt(r.end)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{r.capacity} spot{r.capacity > 1 ? "s" : ""}{r.skill ? ` · needs ${r.skill} experience` : ""}</p>
              <span className={`badge mt-4 w-fit ${full ? "badge-ok" : "badge-muted"}`}>{conf.length} of {r.capacity} filled</span>
              {conf.length > 0 && <ul className="mt-3 space-y-2 text-sm">{conf.map((x) => <li key={x.userId} className="flex items-center gap-2"><Avatar id={x.userId} />{who(s, userById(x.userId)!)}<Check size={14} className="text-accent-foreground" aria-label="signed up" /></li>)}</ul>}
              {e.lastCancelled === r.id && !full && <p className="mt-3 rounded-xl bg-pending px-3 py-2 text-xs text-pending-foreground">A spot opened up. The agent suggests replacements, but they still decide for themselves.</p>}
              {e.published && !full && (
                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Sparkles size={13} aria-hidden="true" />Good fits</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recs.length ? recs.slice(0, 4).map((u) => (
                      <button key={u.id} onClick={() => setUser(u.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-2.5 text-xs transition-colors hover:bg-muted"><Avatar id={u.id} />{u.name} <span className="text-muted-foreground">({titleIn(u, u.clubs.find((m) => def(s).clubs.includes(m.club))!.club)})</span></button>
                    )) : <span className="text-xs text-muted-foreground">No one else is free for this shift.</span>}
                  </div>
                </div>
              )}
              <div className="mt-auto pt-5">
                {mine ? <button className="btn btn-ghost w-full" onClick={() => run((st) => cancelSignup(st, me.id, r.id))}>Cancel my shift</button>
                  : !e.published ? <button className="btn btn-ghost w-full" disabled>Not open yet</button>
                  : why && recs[0] ? <button className="btn btn-ghost w-full" onClick={() => setUser(recs[0]!.id)}><UserRound size={15} aria-hidden="true" />{why}. Switch to {recs[0].name}</button>
                  : <button className="btn btn-primary w-full" disabled={!!why} onClick={() => run((st) => confirmSignup(st, me.id, r.id))}>{why ?? `Sign up as ${me.name}`}</button>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
