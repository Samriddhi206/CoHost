import { createFileRoute, Link } from "@tanstack/react-router";
import { meta } from "@/components/Brand";
import { useDemo } from "@/lib/demo-store";
import { approvalsFor, BUDGET, canPublish, CLUBS, confirmedFor, conflicts, current, fmtRange, REQUIRED } from "@/lib/domain";

export const Route = createFileRoute("/demo/")({
  head: () => ({ meta: meta("Overview — CoHost demo", "Campus Through Our Eyes: a three-club exhibition in the CoHost demo.") }),
  component: Overview,
});

function Overview() {
  const { s } = useDemo();
  const v = current(s);
  const appr = approvalsFor(s, v.version);
  const filled = s.roles.reduce((n, r) => n + confirmedFor(s, r.id).length, 0);
  const cap = s.roles.reduce((n, r) => n + r.capacity, 0);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Photography Club · organizer</p>
        <h1 className="mt-1 text-4xl font-extrabold">Campus Through Our Eyes</h1>
        <p className="mt-2 text-muted-foreground">Exhibition co-hosted by {REQUIRED.map((c) => CLUBS[c].name).join(", ")}.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Budget" value={`$${BUDGET}`} hint="$30 Photo + $150 Business" />
        <Stat label="Current version" value={`v${v.version}`} hint={`Setup ${fmtRange(v.setup)}`} />
        <Stat label="Approvals" value={`${appr.length}/${REQUIRED.length}`} hint={canPublish(s) ? "Ready to publish" : "Waiting on leaders"} pending={!canPublish(s)} />
        <Stat label="Crew" value={`${filled}/${cap}`} hint={s.published ? "Roles published" : "Not published"} pending={!s.published} />
      </div>
      {conflicts(v).length > 0 && <div className="panel border-pending-foreground/30">{conflicts(v).map((c) => <p key={c} className="text-sm text-pending-foreground">{c}</p>)}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel">
          <h2 className="font-bold">Next steps</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Review the agents' structured proposals in the <Link to="/demo/event" className="text-primary underline">workspace</Link>.</li>
            <li>Switch demo account to each leader and approve on <Link to="/demo/approvals" className="text-primary underline">Approvals</Link>.</li>
            <li>As Priya, publish roles; then switch to students and confirm shifts on <Link to="/demo/crew" className="text-primary underline">Crew</Link>.</li>
          </ol>
        </div>
        <div className="panel">
          <h2 className="font-bold">Activity</h2>
          <ul className="mt-3 space-y-2 text-sm">{[...s.log].reverse().slice(0, 6).map((l, i) => <li key={i} className="text-muted-foreground">{l}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, pending }: { label: string; value: string; hint: string; pending?: boolean }) {
  return (
    <div className="panel">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
      <span className={`badge mt-2 ${pending ? "badge-pending" : "badge-ok"}`}>{hint}</span>
    </div>
  );
}
