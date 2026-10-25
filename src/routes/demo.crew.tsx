import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/components/Brand";
import { useDemo } from "@/lib/demo-store";
import { cancelSignup, confirmedFor, confirmSignup, eligibility, fmt, recommend, userById } from "@/lib/domain";

export const Route = createFileRoute("/demo/crew")({
  head: () => ({ meta: meta("Volunteer crew — CoHost demo", "Structured volunteer shifts with agent recommendations and explicit student confirmation.") }),
  component: Crew,
});

function Crew() {
  const { s, run } = useDemo();
  const me = userById(s.currentUserId)!;
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold">Volunteer crew</h1><p className="mt-1 text-muted-foreground">Agents recommend by availability and skills. Students confirm for themselves.</p></div>
      {!s.published && <div className="panel"><span className="badge badge-pending">Not published</span><p className="mt-2 text-sm text-muted-foreground">Roles open after all three leaders approve and the organizer publishes.</p></div>}
      <div className="grid gap-4 md:grid-cols-3">
        {s.roles.map((r) => {
          const conf = confirmedFor(s, r.id);
          const mine = conf.some((x) => x.userId === me.id);
          const why = eligibility(s, me.id, r);
          const recs = recommend(s, r);
          return (
            <div key={r.id} className="panel flex flex-col">
              <h2 className="font-bold">{r.title}</h2>
              <p className="text-sm text-muted-foreground">{fmt(r.start)}–{fmt(r.end)} · {r.capacity} spot{r.capacity > 1 ? "s" : ""}{r.skill ? ` · requires ${r.skill}` : ""}</p>
              <span className={`badge mt-3 w-fit ${conf.length >= r.capacity ? "badge-ok" : "badge-pending"}`}>{conf.length}/{r.capacity} confirmed</span>
              <ul className="mt-3 space-y-1 text-sm">{conf.map((x) => <li key={x.userId}>✓ {userById(x.userId)?.name}</li>)}</ul>
              {s.lastCancelled === r.id && conf.length < r.capacity && <p className="mt-3 rounded-xl bg-pending p-2 text-xs text-pending-foreground">Spot reopened. Suggested replacements are notified to confirm — nobody is auto-assigned.</p>}
              <p className="mt-3 text-xs font-semibold text-muted-foreground">Agent suggestions</p>
              <p className="text-xs text-muted-foreground">{recs.length ? recs.map((u) => u.name).join(", ") : "No eligible students"}</p>
              <div className="mt-auto pt-4">
                {mine ? <button className="btn btn-ghost w-full" onClick={() => run((st) => cancelSignup(st, me.id, r.id))}>Cancel my shift</button>
                  : <button className="btn btn-primary w-full" disabled={!s.published || !!why} onClick={() => run((st) => confirmSignup(st, me.id, r.id))}>{s.published && why ? why : `Confirm as ${me.name}`}</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
