import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Check, Megaphone, UserRound } from "lucide-react";
import { meta } from "@/components/Brand";
import { Avatar, ClubDot } from "@/components/demo-ui";
import { MembersOnlySeeBasics } from "@/components/demo-locked";
import { useDemo } from "@/lib/demo-store";
import { approve, canPublish, canPublishAs, canSeePlan, CLUBS, conflicts, current, def, ev, isOfficer, label, publish, roster, titleIn, topOfficer, userById } from "@/lib/domain";

export const Route = createFileRoute("/demo/approvals")({
  head: () => ({ meta: meta("Step 2: Approve — CoHost demo", "An officer from each club approves their own club's part of the plan.") }),
  component: Approvals,
});

function Approvals() {
  const { s, run, setUser } = useDemo();
  const me = userById(s.currentUserId)!;
  const d = def(s);
  const heading = (
    <div className="max-w-3xl">
      <p className="eyebrow text-primary">Step 2 of 3 · Approve</p>
      <h2 className="mt-2 font-display text-3xl font-extrabold">Every club says yes to its own part</h2>
      <p className="mt-3 text-muted-foreground">Agents can suggest a plan, but only people can commit their club. Any officer of a club can approve that club’s part, and only the latest version counts.</p>
    </div>
  );
  if (!canSeePlan(s, me)) return <div className="space-y-6">{heading}<MembersOnlySeeBasics what="approvals" /></div>;
  const v = current(s);
  const approved = d.clubs.filter((c) => ev(s).approvals.some((a) => a.version === v.version && a.club === c));
  const blocked = conflicts(s).length > 0;
  const opener = roster(d.organizer).find((u) => canPublishAs(s, u))!;
  return (
    <div className="space-y-8">
      {heading}
      <div aria-live="polite" className="flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(approved.length / d.clubs.length) * 100}%` }} /></div>
        <span className="text-sm font-semibold tabular-nums">{approved.length} of {d.clubs.length} clubs approved</span>
      </div>
      {blocked && <p role="alert" className="flex gap-2 rounded-xl bg-pending px-4 py-3 text-sm text-pending-foreground"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />The plan has a scheduling problem, so nobody can approve it yet. <Link to="/demo" className="font-semibold underline">Fix it in step 1</Link></p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {d.clubs.map((c) => {
          const a = ev(s).approvals.find((x) => x.version === v.version && x.club === c);
          const stale = !a && ev(s).approvals.some((x) => x.club === c && x.version < v.version);
          const top = topOfficer(c);
          return (
            <article key={c} className={`panel flex flex-col transition-colors duration-300 ${a ? "border-accent-foreground/40" : ""}`}>
              <p className="flex items-center gap-2 font-display text-lg font-bold"><ClubDot club={c} />{CLUBS[c].name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{v.contributions[c]}</p>
              <div className="mt-4">
                {a ? <span className="badge badge-ok"><Check size={12} aria-hidden="true" />Approved by {label(userById(a.userId)!, c)}</span>
                  : <span className="badge badge-pending">Waiting for an officer</span>}
              </div>
              {stale && <p className="mt-2 text-xs text-muted-foreground">An officer approved an older version. The plan changed, so it needs approving again.</p>}
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Officers who can approve</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {roster(c).filter((u) => isOfficer(u, c)).map((u) => <li key={u.id} className="flex items-center gap-2"><Avatar id={u.id} club={c} />{u.name} <span className="text-muted-foreground">({titleIn(u, c)})</span></li>)}
              </ul>
              <div className="mt-auto pt-5">
                {a ? null : isOfficer(me, c) ? (
                  <button className="btn btn-primary w-full" disabled={blocked} onClick={() => run((st) => approve(st, me.id, c, v.version))}>Approve as {label(me, c)}</button>
                ) : (
                  <button className="btn btn-ghost w-full" onClick={() => setUser(top.id)}><UserRound size={15} aria-hidden="true" />Switch to {label(top, c)}</button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <section className={`panel flex flex-col gap-4 md:flex-row md:items-center ${canPublish(s) && !ev(s).published ? "border-primary/60" : ""}`}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><Megaphone size={20} aria-hidden="true" /></span>
        <div className="flex-1">
          <h2 className="font-display text-lg font-bold">Open volunteer sign-ups</h2>
          <p className="text-sm text-muted-foreground">Once every club approves, the President, Vice President or Event coordinator of {CLUBS[d.organizer].name} opens shifts for members.</p>
        </div>
        {ev(s).published ? (
          <Link to="/demo/crew" className="btn btn-primary">Sign-ups are open <ArrowRight size={16} /></Link>
        ) : canPublishAs(s, me) ? (
          <button className="btn btn-primary" disabled={!canPublish(s)} onClick={() => run((st) => publish(st, me.id))}>{canPublish(s) ? "Open sign-ups" : "Waiting for approvals"}</button>
        ) : (
          <button className="btn btn-ghost" disabled={!canPublish(s)} onClick={() => setUser(opener.id)}>{canPublish(s) ? `Switch to ${label(opener, d.organizer)}` : "Waiting for approvals"}</button>
        )}
      </section>
    </div>
  );
}
