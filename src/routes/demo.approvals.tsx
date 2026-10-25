import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/components/Brand";
import { useDemo } from "@/lib/demo-store";
import { approve, canPublish, CLUBS, current, ORGANIZER, publish, REQUIRED, userById } from "@/lib/domain";

export const Route = createFileRoute("/demo/approvals")({
  head: () => ({ meta: meta("Approvals — CoHost demo", "Each club leader approves their own contribution for the current version.") }),
  component: Approvals,
});

function Approvals() {
  const { s, run } = useDemo();
  const v = current(s);
  const me = userById(s.currentUserId)!;
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold">Approvals for v{v.version}</h1><p className="mt-1 text-muted-foreground">Approvals bind to one version. Any new version requires fresh approvals.</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        {REQUIRED.map((c) => {
          const a = s.approvals.find((x) => x.version === v.version && x.club === c);
          const stale = s.approvals.filter((x) => x.club === c && x.version < v.version);
          return (
            <div key={c} className="panel">
              <h2 className="font-bold">{CLUBS[c].name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{v.contributions[c]}</p>
              <div className="mt-4">{a ? <span className="badge badge-ok">Approved by {userById(a.userId)?.name}</span> : <span className="badge badge-pending">Pending</span>}</div>
              {stale.length > 0 && !a && <p className="mt-2 text-xs text-muted-foreground">Earlier approval on v{stale.map((x) => x.version).join(", v")} is stale.</p>}
              {!a && <button className="btn btn-primary mt-4 w-full" onClick={() => run((st) => approve(st, me.id, c, v.version))}>Approve as {me.name}</button>}
            </div>
          );
        })}
      </div>
      <div className="panel flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="font-bold">Publish volunteer roles</h2><p className="text-sm text-muted-foreground">Only the {CLUBS[ORGANIZER].name} leader, after all approvals.</p></div>
        {s.published ? <span className="badge badge-ok">Published</span> : <button className="btn btn-primary" disabled={!canPublish(s)} onClick={() => run((st) => publish(st, me.id))}>Publish as {me.name}</button>}
      </div>
    </div>
  );
}
