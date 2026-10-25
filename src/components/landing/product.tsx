// Decorative pieces of the real CoHost interface, used as the landing page's imagery.
// They show the product itself (clubs, agent messages, the shared plan, shifts) instead of
// stock scenery. Everything here is aria-hidden; the surrounding sections carry the text.
import { Bot, Check, Clock, LockKeyhole, Users } from "lucide-react";

export const CLUB_TONE = {
  coding: { name: "Coding Club", dot: "bg-club-photo", soft: "bg-club-photo/15 text-club-photo" },
  design: { name: "Design Club", dot: "bg-club-art", soft: "bg-club-art/15 text-club-art" },
  startup: { name: "Entrepreneurship Club", dot: "bg-club-business", soft: "bg-club-business/15 text-club-business" },
} as const;
type Club = keyof typeof CLUB_TONE;

const card = "rounded-2xl border border-white/10 bg-card/90 shadow-[0_24px_60px_-20px_oklch(0_0_0/.7)] backdrop-blur-xl";

export function ClubCard({ club, offer, className = "" }: { club: Club; offer: string; className?: string }) {
  const c = CLUB_TONE[club];
  return (
    <div aria-hidden="true" className={`${card} w-60 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-bold ${c.soft}`}>{c.name[0]}</span>
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">Co-host</p></div>
      </div>
      <p className="mt-3 rounded-xl bg-muted/70 px-3 py-2 text-xs leading-5 text-foreground">{offer}</p>
    </div>
  );
}

export function AgentBubble({ club, text, flag, className = "" }: { club: Club; text: string; flag?: boolean; className?: string }) {
  const c = CLUB_TONE[club];
  return (
    <div aria-hidden="true" className={`${card} w-72 p-4 ${className}`}>
      <p className="flex items-center gap-2 text-xs font-semibold text-foreground"><span className={`h-2 w-2 rounded-full ${c.dot}`} /><Bot size={13} className="text-muted-foreground" />{c.name} agent
        {flag && <span className="ml-auto rounded-full bg-pending px-2 py-0.5 text-[10px] font-bold text-pending-foreground">Problem</span>}</p>
      <p className="mt-2 text-sm leading-6 text-foreground/90">{text}</p>
    </div>
  );
}

export function PlanCard({ approved = 3, className = "" }: { approved?: number; className?: string }) {
  const rows: [Club, string][] = [["coding", "4 mentors + $100"], ["design", "Workshop 6:30 PM"], ["startup", "$200 for pizza"]];
  return (
    <div aria-hidden="true" className={`${card} w-80 p-5 ${className}`}>
      <div className="flex items-center justify-between"><p className="font-display text-base font-bold text-foreground">Hack Night plan</p><span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Version 2</span></div>
      <p className="mt-1 text-xs text-muted-foreground">Friday · 6:00–9:00 PM · $300 covered</p>
      <ul className="mt-4 space-y-2">
        {rows.map(([k, v], i) => (
          <li key={k} className="flex items-center gap-3 rounded-xl border border-white/5 bg-muted/50 px-3 py-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${CLUB_TONE[k].dot}`} /><span className="flex-1 text-foreground">{v}</span>
            {i < approved ? <span className="inline-flex items-center gap-1 font-semibold text-accent-foreground"><Check size={12} />Approved</span> : <span className="text-muted-foreground">Waiting</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ShiftChip({ name, role, className = "" }: { name: string; role: string; className?: string }) {
  return (
    <div aria-hidden="true" className={`${card} flex items-center gap-3 px-4 py-3 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{name[0]}</span>
      <div><p className="text-sm font-semibold text-foreground">{name} signed up</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock size={11} />{role}</p></div>
      <Check size={16} className="ml-2 text-accent-foreground" />
    </div>
  );
}

export function BriefCard({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`${card} w-64 p-4 ${className}`}>
      <p className="flex items-center gap-2 text-xs font-semibold text-foreground"><LockKeyhole size={13} className="text-primary" />Private brief · Entrepreneurship</p>
      <p className="mt-2 select-none text-sm leading-6 text-muted-foreground blur-[4px]">Only the club’s leaders and agent can read this.</p>
    </div>
  );
}

// The big "screenshot" used by the scroll-expansion section: the shared plan screen of the app.
export function AppScreen() {
  const chat: [Club, string, boolean?][] = [
    ["coding", "Let’s run Hack Night Friday 6–9 PM. We need $300 for pizza and prizes. We bring 4 mentors and $100."],
    ["startup", "We’ll cover the other $200 if we get 5 minutes at the end to announce our pitch competition."],
    ["design", "We’ll run the workshop, but our members are in class until 6. A 6:00 PM start won’t work.", true],
    ["design", "Fix: move the workshop to 6:30–7:15 PM. $100 + $200 covers the $300."],
  ];
  return (
    <div aria-hidden="true" className="flex h-full w-full flex-col bg-background text-foreground">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary font-display text-sm font-extrabold text-primary-foreground">co</span>
        <span className="font-display font-bold">CoHost</span>
        <div className="ml-6 hidden gap-2 md:flex">
          {["1 Plan", "2 Approve", "3 Volunteers"].map((s, i) => <span key={s} className={`rounded-full px-3 py-1 text-xs font-semibold ${i === 0 ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>{s}</span>)}
        </div>
        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground"><Users size={14} />3 clubs</span>
      </div>
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 overflow-hidden p-6 pt-24 md:grid-cols-[1.3fr_1fr] md:p-10 md:pt-24">
        <div className="space-y-3">
          <p className="font-display text-xl font-bold">How the agents got there</p>
          {chat.map(([c, t, flag], i) => (
            <div key={i} className="flex gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${CLUB_TONE[c].dot}`} />
              <div className="flex-1 rounded-2xl rounded-tl-sm border border-border bg-muted/50 px-4 py-3 text-sm leading-6">
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">{CLUB_TONE[c].name} agent{flag && <span className="rounded-full bg-pending px-2 text-[10px] text-pending-foreground">Problem</span>}</p>{t}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:block"><PlanCard approved={2} className="w-full" /></div>
      </div>
    </div>
  );
}
