import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { meta } from "@/components/Brand";
import { useDemo } from "@/lib/demo-store";
import { approvalsFor, CLUBS, conflicts, current, fmtRange, propose, t, userById, type ClubId } from "@/lib/domain";

export const Route = createFileRoute("/demo/event")({
  head: () => ({ meta: meta("Event workspace — CoHost demo", "Agent negotiation and versioned agreement for Campus Through Our Eyes.") }),
  component: Workspace,
});

const KIND_STYLE: Record<string, string> = { proposal: "badge-ok", offer: "badge-ok", counteroffer: "badge-pending", constraint: "badge-pending", note: "badge-muted" };

function Workspace() {
  const { s, run } = useDemo();
  const v = current(s);
  const me = userById(s.currentUserId)!;
  const [club, setClub] = useState<ClubId>(me.club);
  const [text, setText] = useState("");
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="panel">
        <h1 className="text-2xl font-extrabold">Negotiation</h1>
        <p className="mt-1 text-xs text-muted-foreground">Agent messages are deterministic scripted proposals (labelled). They are suggestions only — nothing is binding until leaders approve.</p>
        <ul className="mt-5 space-y-3">
          {s.messages.map((m) => (
            <li key={m.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`badge ${KIND_STYLE[m.kind]}`}>{m.kind}</span>
                <span className="font-semibold">{CLUBS[m.club].name} {m.deterministic ? "agent" : "leader"}</span>
                <span className="text-muted-foreground">· v{m.version}</span>
                {m.deterministic && <span className="badge badge-muted">deterministic agent</span>}
              </div>
              <p className="mt-2 text-sm">{m.body}</p>
            </li>
          ))}
        </ul>
        {me.leader && !s.published && (
          <form className="mt-5 space-y-2" onSubmit={(e) => { e.preventDefault(); const note = text.trim().slice(0, 500); if (!note) return; run((st) => propose(st, me.id, { contributions: { ...v.contributions, [club]: note } }, `Changed ${CLUBS[club].name} contribution: ${note}`)); setText(""); }}>
            <p className="text-sm font-semibold">Counteroffer as {me.name} (creates a new version)</p>
            <div className="flex gap-2">
              <select className="field w-auto" value={club} onChange={(e) => setClub(e.target.value as ClubId)}>{(Object.keys(CLUBS) as ClubId[]).map((c) => <option key={c} value={c}>{CLUBS[c].short}</option>)}</select>
              <input className="field" maxLength={500} placeholder="New contribution, e.g. $140 (requires co-host credit)" value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" type="submit">Propose v{v.version + 1}</button>
              <button type="button" className="btn btn-ghost" onClick={() => run((st) => propose(st, me.id, { setup: [t(16, 30), t(17, 30)] }, "Revert setup to 4:30–5:30 PM"))}>Try 4:30–5:30 setup</button>
            </div>
          </form>
        )}
      </section>
      <section className="panel h-fit">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Agreement</h2><span className="badge badge-ok">v{v.version} current</span></div>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="text-muted-foreground">Setup</dt><dd className="font-semibold">{fmtRange(v.setup)}</dd></div>
          {(Object.keys(CLUBS) as ClubId[]).map((c) => <div key={c}><dt className="text-muted-foreground">{CLUBS[c].name}</dt><dd className="font-semibold">{v.contributions[c]}</dd></div>)}
        </dl>
        {conflicts(v).map((c) => <p key={c} className="mt-3 rounded-xl bg-pending p-3 text-sm text-pending-foreground">{c}</p>)}
        <p className="mt-4 text-xs text-muted-foreground">{approvalsFor(s, v.version).length} approvals on this version.</p>
        <h3 className="mt-6 text-sm font-bold">History</h3>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{[...s.versions].reverse().map((x) => <li key={x.version}>v{x.version} · setup {fmtRange(x.setup)} · {x.note}</li>)}</ul>
      </section>
    </div>
  );
}
