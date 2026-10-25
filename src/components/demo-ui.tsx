import { canPublish, userById, type ClubId, type State } from "@/lib/domain";

export const STEPS = [
  { to: "/demo", n: 1, label: "Plan", hint: "See what the agents agreed" },
  { to: "/demo/approvals", n: 2, label: "Approve", hint: "Each leader says yes" },
  { to: "/demo/crew", n: 3, label: "Volunteers", hint: "Students pick shifts" },
] as const;

// Which step the event is on, from the shared demo state.
export function stage(s: State) {
  if (s.published) return 3;
  if (canPublish(s)) return 2;
  return 1;
}

const TONES: Record<string, string> = { coding: "bg-club-photo text-ink", design: "bg-club-art text-ink", startup: "bg-club-business text-ink" };
export function Avatar({ id, size = "sm" }: { id: string; size?: "sm" | "md" }) {
  const u = userById(id)!;
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full font-bold ${TONES[u.club]} ${size === "md" ? "h-9 w-9 text-sm" : "h-6 w-6 text-[11px]"}`}>
      {u.name[0]}
    </span>
  );
}

export function ClubDot({ club }: { club: ClubId }) {
  const c = club === "coding" ? "bg-club-photo" : club === "design" ? "bg-club-art" : "bg-club-business";
  return <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${c}`} />;
}
