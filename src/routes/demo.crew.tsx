import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, Sparkles, UserRound } from "lucide-react";
import { meta } from "@/components/Brand";
import { Avatar } from "@/components/demo-ui";
import { useDemo } from "@/lib/demo-store";
import { cancelSignup, confirmedFor, confirmSignup, eligibility, fmt, recommend, userById } from "@/lib/domain";

export const Route = createFileRoute("/demo/crew")({
  head: () => ({ meta: meta("Step 3: Volunteers — CoHost demo", "Students see shifts that fit their schedule and skills, and sign up themselves.") }),
  component: Crew,
});

function Crew() {
  const { s, run, setUser } = useDemo();
  const me = userById(s.currentUserId)!;
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="eyebrow text-primary">Step 3 of 3 · Volunteers</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Students pick the shifts that fit them</h1>
        <p className="mt-3 text-muted-foreground">The agents suggest who fits each shift based on their free time and skills. Nobody is signed up for them: each student confirms their own shift.</p>
      </div>

      {!s.published && (
        <div className="panel flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Shifts open once all three clubs approve the plan and the organizer opens sign-ups.</p>
          <Link to="/demo/approvals" className="btn btn-primary">Go to step 2</Link>
        </div>
      )}
      {s.published && me.leader && (
        <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">You’re viewing as {me.name}, a club leader. Switch to a student like Ava, Dev or Chloe to sign up for a shift.</p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {s.roles.map((r) => {
          const conf = confirmedFor(s, r.id);
          const mine = conf.some((x) => x.userId === me.id);
          const why = eligibility(s, me.id, r);
          const recs = recommend(s, r).filter((u) => !u.leader);
          const full = conf.length >= r.capacity;
          return (
            <article key={r.id} className="panel flex flex-col">
              <h2 className="font-display text-lg font-bold">{r.title}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock size={14} aria-hidden="true" />{fmt(r.start)}–{fmt(r.end)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{r.capacity} spot{r.capacity > 1 ? "s" : ""}{r.skill ? ` · needs ${r.skill} experience` : ""}</p>
              <span className={`badge mt-4 w-fit ${full ? "badge-ok" : "badge-muted"}`}>{conf.length} of {r.capacity} filled</span>
              {conf.length > 0 && <ul className="mt-3 space-y-2 text-sm">{conf.map((x) => <li key={x.userId} className="flex items-center gap-2"><Avatar id={x.userId} />{userById(x.userId)?.name}<Check size={14} className="text-accent-foreground" aria-label="confirmed" /></li>)}</ul>}
              {s.lastCancelled === r.id && !full && <p className="mt-3 rounded-xl bg-pending px-3 py-2 text-xs text-pending-foreground">A spot opened up. The agent suggests replacements, but they still decide for themselves.</p>}
              {s.published && !full && (
                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Sparkles size={13} aria-hidden="true" />Good fits</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recs.length ? recs.map((u) => (
                      <button key={u.id} onClick={() => setUser(u.id)} disabled={u.id === me.id} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-2.5 text-xs transition-colors hover:bg-muted disabled:opacity-60"><Avatar id={u.id} />{u.name}</button>
                    )) : <span className="text-xs text-muted-foreground">No one else is free for this shift.</span>}
                  </div>
                </div>
              )}
              <div className="mt-auto pt-5">
                {mine ? <button className="btn btn-ghost w-full" onClick={() => run((st) => cancelSignup(st, me.id, r.id))}>Cancel my shift</button>
                  : !s.published ? <button className="btn btn-ghost w-full" disabled>Not open yet</button>
                  : me.leader ? <button className="btn btn-ghost w-full" onClick={() => recs[0] && setUser(recs[0].id)} disabled={!recs[0]}><UserRound size={15} aria-hidden="true" />{recs[0] ? `Switch to ${recs[0].name}` : "No one free"}</button>
                  : <button className="btn btn-primary w-full" disabled={!!why} onClick={() => run((st) => confirmSignup(st, me.id, r.id))}>{why ?? "Sign me up"}</button>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
