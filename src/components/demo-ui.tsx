import { CalendarDays, MapPin } from "lucide-react";
import { Booths, FarSkyline, NearBuildings, Sky, Stars, StringLights } from "@/components/landing/scenery";
import { canPublish, CLUB_ORDER, CLUBS, def, ev, isOfficer, label, roster, titleIn, userById, type ClubId, type State } from "@/lib/domain";

export const STEPS = [
  { to: "/demo", n: 1, label: "Plan", hint: "What the agents agreed" },
  { to: "/demo/approvals", n: 2, label: "Approve", hint: "Each club’s officers say yes" },
  { to: "/demo/crew", n: 3, label: "Volunteers", hint: "Members pick shifts" },
] as const;

// Which step the current event is on.
export function stage(s: State) {
  if (ev(s).published) return 3;
  if (canPublish(s)) return 2;
  return 1;
}

const DOT: Record<ClubId, string> = { coding: "bg-club-photo", design: "bg-club-art", startup: "bg-club-business" };
const TONE: Record<ClubId, string> = { coding: "bg-club-photo text-ink", design: "bg-club-art text-ink", startup: "bg-club-business text-ink" };

export function ClubDot({ club }: { club: ClubId }) {
  return <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${DOT[club]}`} />;
}

export function Avatar({ id, club, size = "sm" }: { id: string; club?: ClubId; size?: "sm" | "md" }) {
  const u = userById(id)!;
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full font-bold ${TONE[club ?? u.clubs[0]!.club]} ${size === "md" ? "h-9 w-9 text-sm" : "h-6 w-6 text-[11px]"}`}>
      {u.name[0]}
    </span>
  );
}

/** Everyone in the demo, organized by club and then by role, most senior first. */
export function PersonPicker({ s, onPick, clubs = CLUB_ORDER }: { s: State; onPick: (id: string) => void; clubs?: ClubId[] }) {
  return (
    <div className="space-y-4">
      {clubs.map((c) => (
        <div key={c} role="group" aria-label={CLUBS[c].name}>
          <p className="mb-1.5 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-[.14em] text-white/50"><ClubDot club={c} />{CLUBS[c].name}</p>
          <ul className="space-y-0.5">
            {roster(c).map((u) => {
              const me = u.id === s.currentUserId;
              return (
                <li key={u.id}>
                  <button onClick={() => onPick(u.id)} aria-pressed={me}
                    className={`flex min-h-10 w-full items-center gap-2.5 rounded-xl px-2 text-left text-sm transition-colors duration-200 ${me ? "bg-primary text-primary-foreground" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
                    <Avatar id={u.id} club={c} />
                    <span className="min-w-0 flex-1 truncate">{u.name} <span className={me ? "opacity-80" : "text-white/50"}>({titleIn(u, c)})</span></span>
                    {isOfficer(u, c) && <span className={`text-[10px] font-bold uppercase tracking-wider ${me ? "opacity-80" : "text-white/40"}`}>Officer</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Short night-campus banner at the top of every demo page, matching the landing page. */
export function EventBanner({ s }: { s: State }) {
  const d = def(s);
  return (
    <section aria-labelledby="event-title" className="relative overflow-hidden rounded-[var(--radius)] border border-border bg-ink text-white">
      <div aria-hidden="true" className="absolute inset-0"><Sky /><Stars count={50} /></div>
      <div aria-hidden="true" className="absolute inset-0 translate-y-[18%] opacity-70"><FarSkyline /></div>
      <div aria-hidden="true" className="absolute inset-0 translate-y-[22%] opacity-80"><NearBuildings /></div>
      <div aria-hidden="true" className="absolute inset-0 translate-y-[30%]"><StringLights /><Booths /></div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/70 to-ink/20" />
      <div className="relative p-6 md:p-8">
        <p className="eyebrow text-flare">Organized by {CLUBS[d.organizer].name}</p>
        <h1 id="event-title" className="mt-2 font-display text-3xl font-extrabold md:text-4xl">{d.title}</h1>
        <p className="mt-1 text-white/75">{d.tagline}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/85">
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} aria-hidden="true" />{d.when}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={15} aria-hidden="true" />{d.where}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {d.clubs.map((c) => <span key={c} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur"><ClubDot club={c} />{CLUBS[c].name}</span>)}
        </div>
      </div>
    </section>
  );
}

export { label };
