// Pure domain rules for the isolated DEMO. Production enforcement lives in
// supabase/migrations (RLS + security-definer RPCs). These mirror those rules
// so the demo behaves the same; they are NOT a security boundary.

export type ClubId = "coding" | "design" | "startup";
export const CLUBS: Record<ClubId, { name: string; short: string }> = {
  coding: { name: "Coding Club", short: "Coding" },
  design: { name: "Design Club", short: "Design" },
  startup: { name: "Entrepreneurship Club", short: "Entrepreneurship" },
};
export const ORGANIZER: ClubId = "coding";
export const REQUIRED: ClubId[] = ["coding", "design", "startup"];
export const EVENT = { title: "Hack Night", tagline: "Build your first app in one evening", when: "Friday, 6:00–9:00 PM", where: "Engineering Hall, Room 101" };

export type DemoUser = {
  id: string;
  name: string;
  club: ClubId;
  leader: boolean;
  skills: string[];
  available: [number, number]; // minutes since midnight
};

export type Version = {
  version: number;
  workshop: [number, number];
  contributions: Record<ClubId, string>;
  createdBy: string;
  note: string;
};

export type MsgKind = "proposal" | "offer" | "counteroffer" | "constraint" | "note";
export type Msg = { id: string; kind: MsgKind; club: ClubId; version: number; body: string; deterministic: boolean };
export type Approval = { version: number; club: ClubId; userId: string };
export type Role = { id: string; title: string; start: number; end: number; capacity: number; skill?: string };
export type Signup = { roleId: string; userId: string; status: "confirmed" | "cancelled" };

export type State = {
  currentUserId: string;
  versions: Version[];
  messages: Msg[];
  approvals: Approval[];
  published: boolean;
  roles: Role[];
  signups: Signup[];
  lastCancelled?: string | undefined; // roleId
  log: string[];
};

export class DomainError extends Error {}

export const t = (h: number, m = 0) => h * 60 + m;
export const fmt = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
export const fmtRange = ([a, b]: [number, number]) => `${fmt(a)}–${fmt(b)}`;

// Design Club members are in class until 6:00 PM, so their workshop can't start before 6:30.
export const DESIGN_EARLIEST = t(18, 30);
export const BUDGET = 300;

export const current = (s: State): Version => { const v = s.versions.at(-1); if (!v) throw new DomainError("No proposal exists"); return v; };
export const userById = (id: string) => USERS.find((u) => u.id === id);

export function conflicts(v: Version): string[] {
  const out: string[] = [];
  if (v.workshop[0] < DESIGN_EARLIEST) out.push(`The design workshop starts at ${fmt(v.workshop[0])}, but Design Club members are in class until 6:00 PM and can't start before 6:30 PM.`);
  if (v.workshop[1] <= v.workshop[0]) out.push("The workshop must end after it starts.");
  return out;
}

export function approvalsFor(s: State, version: number) {
  return s.approvals.filter((a) => a.version === version);
}

export function approve(s: State, userId: string, club: ClubId, version: number): State {
  const u = userById(userId);
  if (!u || !u.leader || u.club !== club) throw new DomainError(`Only a leader of ${CLUBS[club].name} can approve its part.`);
  if (version !== current(s).version) throw new DomainError("The plan changed since this version. Review the latest plan first.");
  if (s.approvals.some((a) => a.version === version && a.club === club)) throw new DomainError("This club already approved the current plan.");
  if (conflicts(current(s)).length) throw new DomainError("Fix the scheduling conflict before approving.");
  return { ...s, approvals: [...s.approvals, { version, club, userId }], log: [...s.log, `${u.name} approved ${CLUBS[club].name}’s part of version ${version}`] };
}

export function propose(s: State, userId: string, patch: Partial<Pick<Version, "workshop" | "contributions">>, note: string): State {
  const u = userById(userId);
  if (!u?.leader) throw new DomainError("Only club leaders can change the plan.");
  if (s.published) throw new DomainError("Volunteer sign-ups are already open, so the plan is locked.");
  const prev = current(s);
  const v: Version = { version: prev.version + 1, workshop: patch.workshop ?? prev.workshop, contributions: { ...prev.contributions, ...patch.contributions }, createdBy: userId, note };
  const msg: Msg = { id: `m${s.messages.length + 1}`, kind: "counteroffer", club: u.club, version: v.version, body: note, deterministic: false };
  return { ...s, versions: [...s.versions, v], messages: [...s.messages, msg], log: [...s.log, `${u.name} changed the plan (version ${v.version}), so earlier approvals were cleared`] };
}

export function canPublish(s: State) {
  const v = current(s).version;
  const have = new Set(approvalsFor(s, v).map((a) => a.club));
  return REQUIRED.every((c) => have.has(c)) && conflicts(current(s)).length === 0;
}

export function publish(s: State, userId: string): State {
  const u = userById(userId);
  if (!u?.leader || u.club !== ORGANIZER) throw new DomainError("Only the organizing club leader can open sign-ups.");
  if (!canPublish(s)) throw new DomainError("All three clubs must approve the current plan first.");
  return { ...s, published: true, log: [...s.log, `${u.name} opened volunteer sign-ups`] };
}

const overlap = (a: [number, number], b: [number, number]) => a[0] < b[1] && b[0] < a[1];
export const confirmedFor = (s: State, roleId: string) => s.signups.filter((x) => x.roleId === roleId && x.status === "confirmed");

export function eligibility(s: State, userId: string, role: Role): string | null {
  const u = userById(userId);
  if (!u) return "Unknown student";
  if (role.skill && !u.skills.includes(role.skill)) return `Requires ${role.skill}`;
  if (u.available[0] > role.start || u.available[1] < role.end) return "Not available for this shift";
  if (confirmedFor(s, role.id).some((x) => x.userId === userId)) return "Already confirmed";
  const mine = s.signups.filter((x) => x.userId === userId && x.status === "confirmed");
  for (const m of mine) {
    const r = s.roles.find((r) => r.id === m.roleId)!;
    if (overlap([r.start, r.end], [role.start, role.end])) return `Overlaps your ${r.title} shift`;
  }
  if (confirmedFor(s, role.id).length >= role.capacity) return "Role is full";
  return null;
}

export function recommend(s: State, role: Role) {
  return USERS.filter((u) => !u.leader || u.skills.length).filter((u) => eligibility(s, u.id, role) === null);
}

export function confirmSignup(s: State, userId: string, roleId: string): State {
  if (!s.published) throw new DomainError("Volunteer sign-ups aren’t open yet.");
  const role = s.roles.find((r) => r.id === roleId);
  if (!role) throw new DomainError("Unknown role");
  const why = eligibility(s, userId, role);
  if (why) throw new DomainError(why);
  const u = userById(userId)!;
  return { ...s, signups: [...s.signups, { roleId, userId, status: "confirmed" }], lastCancelled: s.lastCancelled === roleId ? undefined : s.lastCancelled, log: [...s.log, `${u.name} confirmed ${role.title}`] };
}

export function cancelSignup(s: State, userId: string, roleId: string): State {
  const idx = s.signups.findIndex((x) => x.roleId === roleId && x.userId === userId && x.status === "confirmed");
  if (idx < 0) throw new DomainError("You have no confirmed signup for this role.");
  const signups = s.signups.map((x, i) => (i === idx ? { ...x, status: "cancelled" as const } : x));
  const role = s.roles.find((r) => r.id === roleId)!;
  return { ...s, signups, lastCancelled: roleId, log: [...s.log, `${userById(userId)!.name} cancelled ${role.title} — spot reopened`] };
}

export const USERS: DemoUser[] = [
  { id: "u-maya", name: "Maya", club: "coding", leader: true, skills: ["coding"], available: [t(17), t(21)] },
  { id: "u-leo", name: "Leo", club: "design", leader: true, skills: ["design"], available: [t(18), t(21)] },
  { id: "u-jordan", name: "Jordan", club: "startup", leader: true, skills: [], available: [t(17), t(21)] },
  { id: "u-ava", name: "Ava", club: "coding", leader: false, skills: ["coding"], available: [t(17, 30), t(21)] },
  { id: "u-ben", name: "Ben", club: "startup", leader: false, skills: [], available: [t(17, 30), t(19)] },
  { id: "u-chloe", name: "Chloe", club: "design", leader: false, skills: ["design"], available: [t(18), t(20)] },
  { id: "u-dev", name: "Dev", club: "coding", leader: false, skills: ["coding"], available: [t(18, 30), t(21)] },
  { id: "u-eli", name: "Eli", club: "startup", leader: false, skills: [], available: [t(17), t(21)] },
];

export const ROLE_LABEL = (u: DemoUser) => (u.leader ? `${CLUBS[u.club].short} leader` : `${CLUBS[u.club].short} member`);

export const BRIEFS: Record<ClubId, string> = {
  coding: "We need $300 for pizza and prizes. We can put in $100 at most. Don't tell the other clubs our limit. Most important: the event starts on time at 6:00 PM.",
  design: "We'll run a 45-minute “design your app” workshop. Our members are in class until 6:00 PM, so we can't start before 6:30 PM. Not negotiable.",
  startup: "We can pay up to $200 for pizza, but only if we get 5 minutes at the end to invite people to our pitch competition. If they say no, offer $80.",
};

export function initialState(): State {
  const contributions = { coding: "Runs the event, 4 mentors, $100", design: "45-minute design workshop", startup: "$200 for pizza, gets a 5-minute closing talk" };
  return {
    currentUserId: "u-maya",
    versions: [
      { version: 1, workshop: [t(18), t(18, 45)], contributions, createdBy: "u-maya", note: "First plan from the agents" },
      { version: 2, workshop: [t(18, 30), t(19, 15)], contributions, createdBy: "u-leo", note: "Moved the workshop to 6:30 PM so Design Club can make it" },
    ],
    messages: [
      { id: "m1", kind: "proposal", club: "coding", version: 1, body: "Let’s run Hack Night on Friday, 6–9 PM. We need $300 for pizza and prizes. Coding Club brings 4 mentors and $100. Design workshop at 6:00 PM.", deterministic: true },
      { id: "m2", kind: "offer", club: "startup", version: 1, body: "We’ll cover the other $200 for pizza if we get a 5-minute talk at the end to announce our pitch competition.", deterministic: true },
      { id: "m3", kind: "constraint", club: "design", version: 1, body: "We’ll run the workshop, but our members are in class until 6:00. A 6:00 PM start won’t work for us.", deterministic: true },
      { id: "m4", kind: "counteroffer", club: "design", version: 2, body: "New plan: keep everything the same, but move the workshop to 6:30–7:15 PM. $100 + $200 covers the $300.", deterministic: true },
    ],
    approvals: [{ version: 1, club: "coding", userId: "u-maya" }],
    published: false,
    roles: [
      { id: "r-setup", title: "Setup and pizza", start: t(17, 30), end: t(18, 30), capacity: 2 },
      { id: "r-checkin", title: "Check-in desk", start: t(18), end: t(19), capacity: 2 },
      { id: "r-mentor", title: "Coding mentor", start: t(18, 30), end: t(21), capacity: 1, skill: "coding" },
    ],
    signups: [],
    log: ["Maya approved the first plan, but it changed, so that approval no longer counts"],
  };
}
