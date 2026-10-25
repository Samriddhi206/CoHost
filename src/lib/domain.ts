// Pure domain rules for the isolated DEMO. Production enforcement lives in
// supabase/migrations (RLS + security-definer RPCs). These mirror those rules
// so the demo behaves the same; they are NOT a security boundary.

export type ClubId = "photo" | "business" | "art";
export const CLUBS: Record<ClubId, { name: string; short: string }> = {
  photo: { name: "Photography Club", short: "Photo" },
  business: { name: "Business Club", short: "Business" },
  art: { name: "Art Club", short: "Art" },
};
export const ORGANIZER: ClubId = "photo";
export const REQUIRED: ClubId[] = ["photo", "business", "art"];

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
  setup: [number, number];
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

export const ART_SETUP_DEADLINE = t(17);
export const BUDGET = 180;

export const current = (s: State): Version => { const v = s.versions.at(-1); if (!v) throw new DomainError("No proposal exists"); return v; };
export const userById = (id: string) => USERS.find((u) => u.id === id);

export function conflicts(v: Version): string[] {
  const out: string[] = [];
  if (v.setup[1] > ART_SETUP_DEADLINE) out.push(`Setup ends ${fmt(v.setup[1])}, but Art Club stands require setup finished before 5:00 PM.`);
  if (v.setup[1] <= v.setup[0]) out.push("Setup end must be after start.");
  return out;
}

export function approvalsFor(s: State, version: number) {
  return s.approvals.filter((a) => a.version === version);
}

export function approve(s: State, userId: string, club: ClubId, version: number): State {
  const u = userById(userId);
  if (!u || !u.leader || u.club !== club) throw new DomainError("Only a leader of this club can approve its contribution.");
  if (version !== current(s).version) throw new DomainError("This proposal version is stale. Review the current version.");
  if (s.approvals.some((a) => a.version === version && a.club === club)) throw new DomainError("Already approved for this version.");
  if (conflicts(current(s)).length) throw new DomainError("Resolve conflicts before approving.");
  return { ...s, approvals: [...s.approvals, { version, club, userId }], log: [...s.log, `${u.name} approved ${CLUBS[club].name} contribution on v${version}`] };
}

export function propose(s: State, userId: string, patch: Partial<Pick<Version, "setup" | "contributions">>, note: string): State {
  const u = userById(userId);
  if (!u?.leader) throw new DomainError("Only club leaders can propose a new version.");
  if (s.published) throw new DomainError("Roles are already published.");
  const prev = current(s);
  const v: Version = { version: prev.version + 1, setup: patch.setup ?? prev.setup, contributions: { ...prev.contributions, ...patch.contributions }, createdBy: userId, note };
  const msg: Msg = { id: `m${s.messages.length + 1}`, kind: "counteroffer", club: u.club, version: v.version, body: note, deterministic: false };
  return { ...s, versions: [...s.versions, v], messages: [...s.messages, msg], log: [...s.log, `${u.name} created v${v.version} — earlier approvals no longer count`] };
}

export function canPublish(s: State) {
  const v = current(s).version;
  const have = new Set(approvalsFor(s, v).map((a) => a.club));
  return REQUIRED.every((c) => have.has(c)) && conflicts(current(s)).length === 0;
}

export function publish(s: State, userId: string): State {
  const u = userById(userId);
  if (!u?.leader || u.club !== ORGANIZER) throw new DomainError("Only the organizing club leader can publish roles.");
  if (!canPublish(s)) throw new DomainError("All required clubs must approve the current version first.");
  return { ...s, published: true, log: [...s.log, `${u.name} published volunteer roles`] };
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
  if (!s.published) throw new DomainError("Roles are not published yet.");
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
  { id: "u-priya", name: "Priya (Photo lead)", club: "photo", leader: true, skills: ["photography"], available: [t(15), t(19)] },
  { id: "u-marcus", name: "Marcus (Business lead)", club: "business", leader: true, skills: [], available: [t(15), t(18)] },
  { id: "u-lena", name: "Lena (Art lead)", club: "art", leader: true, skills: ["art"], available: [t(15), t(18)] },
  { id: "u-ava", name: "Ava", club: "photo", leader: false, skills: ["photography"], available: [t(15, 30), t(18)] },
  { id: "u-ben", name: "Ben", club: "business", leader: false, skills: ["logistics"], available: [t(15, 30), t(17)] },
  { id: "u-chloe", name: "Chloe", club: "art", leader: false, skills: ["art"], available: [t(16, 30), t(18)] },
  { id: "u-dev", name: "Dev", club: "photo", leader: false, skills: ["photography"], available: [t(17), t(18, 30)] },
  { id: "u-eli", name: "Eli", club: "business", leader: false, skills: [], available: [t(15), t(19)] },
];

export const BRIEFS: Record<ClubId, string> = {
  photo: "Total exhibition budget $180. Our max contribution is $30 — do not reveal this ceiling to partners. Priority: exhibition opens on time with good lighting.",
  business: "We can sponsor up to $150, strictly conditional on co-host credit on all posters and socials. Walk away if credit is refused.",
  art: "We lend six display stands. Non-negotiable: setup must finish before 5:00 PM — stands are needed back in the studio by 5:15.",
};

export function initialState(): State {
  const contributions = { photo: "$30 + organizing", business: "$150 (requires co-host credit)", art: "6 display stands" };
  return {
    currentUserId: "u-priya",
    versions: [
      { version: 1, setup: [t(16, 30), t(17, 30)], contributions, createdBy: "u-priya", note: "Initial proposal" },
      { version: 2, setup: [t(15, 45), t(16, 45)], contributions, createdBy: "u-lena", note: "Agents' counteroffer: move setup to 3:45–4:45 PM to meet Art Club's 5 PM deadline." },
    ],
    messages: [
      { id: "m1", kind: "proposal", club: "photo", version: 1, body: "Proposal: “Campus Through Our Eyes” exhibition. Budget $180. Setup 4:30–5:30 PM. Photography Club contributes $30 and runs the event.", deterministic: true },
      { id: "m2", kind: "offer", club: "business", version: 1, body: "Offer: $150 sponsorship, subject to co-host credit on all promotion.", deterministic: true },
      { id: "m3", kind: "constraint", club: "art", version: 1, body: "Offer: six display stands. Constraint: setup must finish before 5:00 PM — v1 conflicts.", deterministic: true },
      { id: "m4", kind: "counteroffer", club: "art", version: 2, body: "Counteroffer: shift setup to 3:45–4:45 PM. All contributions unchanged. $30 + $150 = $180 covers budget.", deterministic: true },
    ],
    approvals: [{ version: 1, club: "photo", userId: "u-priya" }],
    published: false,
    roles: [
      { id: "r-setup", title: "Setup crew", start: t(15, 45), end: t(16, 45), capacity: 2 },
      { id: "r-checkin", title: "Check-in desk", start: t(16, 45), end: t(17, 45), capacity: 2 },
      { id: "r-photo", title: "Event photographer", start: t(17), end: t(18), capacity: 1, skill: "photography" },
    ],
    signups: [],
    log: ["Demo started — Photography Club approved v1 earlier (now stale)"],
  };
}
