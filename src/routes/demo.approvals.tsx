import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Check, Megaphone, UserRound } from "lucide-react";
import { meta } from "@/components/Brand";
import { Avatar, ClubDot } from "@/components/demo-ui";
import { useDemo } from "@/lib/demo-store";
import { approve, canPublish, CLUBS, conflicts, current, ORGANIZER, publish, REQUIRED, USERS, userById } from "@/lib/domain";

export const Route = createFileRoute("/demo/approvals")({
  head: () => ({ meta: meta("Step 2: Approve — CoHost demo", "A leader from each club approves their own club's part of the plan.") }),
  component: Approvals,
});

function Approvals() {
  const { s, run, setUser } = useDemo();
  const v = current(s);
  const me = userById(s.currentUserId)!;
  const approved = REQUIRED.filter((c) => s.approvals.some((a) => a.version === v.version && a.club === c));
  const organizerLead = USERS.find((u) => u.leader && u.club === ORGANIZER)!;
  const blocked = conflicts(v).length > 0;
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="eyebrow text-primary">Step 2 of 3 · Approve</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Every club says yes to its own part</h1>
        <p className="mt-3 text-muted-foreground">Agents can suggest a plan, but only people can commit their club. Each leader approves just their club’s part, and only the latest version counts.</p>
      </div>

      <div aria-live="polite" className="flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(approved.length / REQUIRED.length) * 100}%` }} /></div>
        <span className="text-sm font-semibold tabular-nums">{approved.length} of {REQUIRED.length} approved</span>
      </div>

      {blocked && <p role="alert" className="flex gap-2 rounded-xl bg-pending px-4 py-3 text-sm text-pending-foreground"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />The plan has a scheduling problem, so nobody can approve it yet. <Link to="/demo" className="font-semibold underline">Fix it in step 1</Link></p>}

      <div className="grid gap-4 md:grid-cols-3">
        {REQUIRED.map((c) => {
          const a = s.approvals.find((x) => x.version === v.version && x.club === c);
          const lead = USERS.find((u) => u.leader && u.club === c)!;
          const stale = !a && s.approvals.some((x) => x.club === c && x.version < v.version);
          const mine = me.leader && me.club === c;
          return (
            <article key={c} className={`panel flex flex-col transition-colors duration-300 ${a ? "border-accent-foreground/40" : ""}`}>
              <p className="flex items-center gap-2 font-display text-lg font-bold"><ClubDot club={c} />{CLUBS[c].name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{v.contributions[c]}</p>
              <p className="mt-4 flex items-center gap-2 text-sm"><Avatar id={lead.id} />Leader: {lead.name}</p>
              <div className="mt-4">
                {a ? <span className="badge badge-ok"><Check size={12} aria-hidden="true" />Approved by {userById(a.userId)?.name}</span>
                  : <span className="badge badge-pending">Waiting for {lead.name}</span>}
              </div>
              {stale && <p className="mt-2 text-xs text-muted-foreground">{lead.name} approved an older version. The plan changed, so they need to approve again.</p>}
              <div className="mt-auto pt-5">
                {a ? null : mine ? (
                  <button className="btn btn-primary w-full" disabled={blocked} onClick={() => run((st) => approve(st, me.id, c, v.version))}>Approve {CLUBS[c].name}’s part</button>
                ) : (
                  <button className="btn btn-ghost w-full" onClick={() => setUser(lead.id)}><UserRound size={15} aria-hidden="true" />Switch to {lead.name} to approve</button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <section className={`panel flex flex-col gap-4 md:flex-row md:items-center ${canPublish(s) && !s.published ? "border-primary/60" : ""}`}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><Megaphone size={20} aria-hidden="true" /></span>
        <div className="flex-1">
          <h2 className="font-display text-lg font-bold">Open volunteer sign-ups</h2>
          <p className="text-sm text-muted-foreground">Once all three clubs approve, {organizerLead.name} from {CLUBS[ORGANIZER].name} (the organizer) opens shifts for students.</p>
        </div>
        {s.published ? (
          <Link to="/demo/crew" className="btn btn-primary">Sign-ups are open <ArrowRight size={16} /></Link>
        ) : me.id === organizerLead.id ? (
          <button className="btn btn-primary" disabled={!canPublish(s)} onClick={() => run((st) => publish(st, me.id))}>{canPublish(s) ? "Open sign-ups" : "Waiting for approvals"}</button>
        ) : (
          <button className="btn btn-ghost" disabled={!canPublish(s)} onClick={() => setUser(organizerLead.id)}>{canPublish(s) ? `Switch to ${organizerLead.name} to open sign-ups` : "Waiting for approvals"}</button>
        )}
      </section>
    </div>
  );
}
