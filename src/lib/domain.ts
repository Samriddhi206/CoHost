// Pure domain rules for the isolated DEMO. Production enforcement lives in
// db/migrations (RLS + security-definer RPCs). These mirror those rules
// so the demo behaves the same; they are NOT a security boundary.

export type ClubId = "coding" | "design" | "startup";
export const CLUBS: Record<ClubId, { name: string; short: string }> = {
  coding: { name: "Coding Club", short: "Coding" },
  design: { name: "Design Club", short: "Design" },
  startup: { name: "Entrepreneurship Club", short: "Entrepreneurship" },
};
export const CLUB_ORDER: ClubId[] = ["coding", "design", "startup"];

// Club roles, most senior first. Everyone above "Member" is an officer.
export const TITLES = ["President", "Vice President", "Budget officer", "Event coordinator", "Member"] as const;
export type Title = (typeof TITLES)[number];
export const rank = (t: Title) => TITLES.indexOf(t);
export const isOfficerTitle = (t: Title) => t !== "Member";
export const PERMISSIONS: Record<"officer" | "member", string[]> = {
  officer: ["See the full plan and the agents’ messages", "Read and edit your club’s private brief", "Approve your club’s part of the plan", "Volunteer for shifts"],
  member: ["See where and when events happen", "Volunteer for shifts"],
};

export type Membership = { club: ClubId; title: Title };
export type DemoUser = {
  id: string;
  name: string;
  clubs: Membership[];
  skills: string[];
  available: [number, number]; // minutes since midnight
};

export type EventId = "hack-night" | "pitch-night";
export type EventDef = {
  id: EventId;
  title: string;
  tagline: string;
  when: string;
  where: string;
  organizer: ClubId;
  clubs: ClubId[];
  budget: number;
  /** What the timed slot in the plan is called. */
  session: string;
  /** Earliest allowed workshop start, if a partner club has a time limit. */
  earliest?: { club: ClubId; at: number; why: string };
};

export type Version = {
  version: number;
  workshop: [number, number];
  contributions: Partial<Record<ClubId, string>>;
  createdBy: string;
  note: string;
};

export type MsgKind = "proposal" | "offer" | "counteroffer" | "constraint" | "note";
export type Msg = { id: string; kind: MsgKind; club: ClubId; version: number; body: string; deterministic: boolean };
export type Approval = { version: number; club: ClubId; userId: string };
export type Role = { id: string; title: string; start: number; end: number; capacity: number; skill?: string };
export type Signup = { roleId: string; userId: string; status: "confirmed" | "cancelled" };

export type EventState = {
  versions: Version[];
  messages: Msg[];
  approvals: Approval[];
  published: boolean;
  roles: Role[];
  signups: Signup[];
  lastCancelled?: string | undefined; // roleId
  log: string[];
};

export type State = {
  currentUserId: string;
  currentEventId: EventId;
  events: Record<EventId, EventState>;
};

export class DomainError extends Error {}

export const t = (h: number, m = 0) => h * 60 + m;
export const fmt = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
export const fmtRange = ([a, b]: [number, number]) => `${fmt(a)}–${fmt(b)}`;

export const EVENTS: Record<EventId, EventDef> = {
  "hack-night": {
    id: "hack-night", title: "Hack Night", tagline: "Build your first app in one evening",
    when: "Friday, 6:00–9:00 PM", where: "Engineering Hall, Room 101",
    organizer: "coding", clubs: ["coding", "design", "startup"], budget: 300, session: "Design workshop",
    earliest: { club: "design", at: t(18, 30), why: "Design Club members are in class until 6:00 PM" },
  },
  "pitch-night": {
    id: "pitch-night", title: "Pitch Night", tagline: "Students pitch startup ideas to local founders",
    when: "Next Thursday, 7:00–9:00 PM", where: "Business School Atrium",
    organizer: "startup", clubs: ["startup", "coding"], budget: 150, session: "Pitches",
  },
};

export const USERS: DemoUser[] = [
  { id: "u-maya", name: "Maya", clubs: [{ club: "coding", title: "President" }], skills: ["coding"], available: [t(17), t(21)] },
  { id: "u-ava", name: "Ava", clubs: [{ club: "coding", title: "Budget officer" }], skills: ["coding"], available: [t(17, 30), t(21)] },
  { id: "u-dev", name: "Dev", clubs: [{ club: "coding", title: "Member" }, { club: "startup", title: "Member" }], skills: ["coding"], available: [t(18, 30), t(21)] },
  { id: "u-eli", name: "Eli", clubs: [{ club: "coding", title: "Member" }], skills: [], available: [t(17), t(21)] },
  { id: "u-leo", name: "Leo", clubs: [{ club: "design", title: "President" }], skills: ["design"], available: [t(18), t(21)] },
  { id: "u-chloe", name: "Chloe", clubs: [{ club: "design", title: "Event coordinator" }, { club: "coding", title: "Member" }], skills: ["design"], available: [t(18), t(20)] },
  { id: "u-sam", name: "Sam", clubs: [{ club: "design", title: "Member" }], skills: [], available: [t(17, 30), t(19, 30)] },
  { id: "u-jordan", name: "Jordan", clubs: [{ club: "startup", title: "President" }], skills: [], available: [t(17), t(21)] },
  { id: "u-ben", name: "Ben", clubs: [{ club: "startup", title: "Budget officer" }], skills: [], available: [t(17, 30), t(19)] },
];

export const userById = (id: string) => USERS.find((u) => u.id === id);
export const titleIn = (u: DemoUser, club: ClubId) => u.clubs.find((m) => m.club === club)?.title;
export const isOfficer = (u: DemoUser, club: ClubId) => { const x = titleIn(u, club); return !!x && isOfficerTitle(x); };
export const label = (u: DemoUser, club: ClubId) => `${u.name} (${titleIn(u, club) ?? "Guest"})`;

/** Members of a club, most senior role first. */
export function roster(club: ClubId) {
  return USERS.filter((u) => titleIn(u, club)).sort((a, b) => rank(titleIn(a, club)!) - rank(titleIn(b, club)!) || a.name.localeCompare(b.name));
}
/** The most senior officer of a club: who the demo suggests switching to. */
export const topOfficer = (club: ClubId) => roster(club).find((u) => isOfficer(u, club))!;

export const ev = (s: State) => s.events[s.currentEventId];
export const def = (s: State) => EVENTS[s.currentEventId];
export const eventsFor = (u: DemoUser) => (Object.values(EVENTS) as EventDef[]).filter((e) => e.clubs.some((c) => titleIn(u, c)));
/** Officers of any club in the event see the full plan; members see the basics. */
export const canSeePlan = (s: State, u: DemoUser) => def(s).clubs.some((c) => isOfficer(u, c));
export const inEvent = (s: State, u: DemoUser) => def(s).clubs.some((c) => titleIn(u, c));
/** The organizing club's President or Event coordinator opens sign-ups. */
export const canPublishAs = (s: State, u: DemoUser) => { const x = titleIn(u, def(s).organizer); return x === "President" || x === "Event coordinator" || x === "Vice President"; };

export const current = (s: State): Version => { const v = ev(s).versions.at(-1); if (!v) throw new DomainError("No plan exists yet"); return v; };

export function conflicts(s: State, v: Version = current(s)): string[] {
  const out: string[] = [];
  const e = def(s).earliest;
  if (e && v.workshop[0] < e.at) out.push(`The workshop starts at ${fmt(v.workshop[0])}, but ${e.why}, so it can’t start before ${fmt(e.at)}.`);
  if (v.workshop[1] <= v.workshop[0]) out.push("The session must end after it starts.");
  return out;
}

export const approvalsFor = (s: State, version: number) => ev(s).approvals.filter((a) => a.version === version);

const put = (s: State, e: Partial<EventState>): State => ({ ...s, events: { ...s.events, [s.currentEventId]: { ...ev(s), ...e } } });
const log = (s: State, line: string) => [...ev(s).log, line];

export function approve(s: State, userId: string, club: ClubId, version: number): State {
  const u = userById(userId);
  if (!u || !isOfficer(u, club)) throw new DomainError(`Only an officer of ${CLUBS[club].name} can approve its part.`);
  if (!def(s).clubs.includes(club)) throw new DomainError(`${CLUBS[club].name} isn’t part of this event.`);
  if (version !== current(s).version) throw new DomainError("The plan changed since this version. Review the latest plan first.");
  if (ev(s).approvals.some((a) => a.version === version && a.club === club)) throw new DomainError("This club already approved the current plan.");
  if (conflicts(s).length) throw new DomainError("Fix the scheduling problem before approving.");
  return put(s, { approvals: [...ev(s).approvals, { version, club, userId }], log: log(s, `${label(u, club)} approved ${CLUBS[club].name}’s part of version ${version}`) });
}

export function propose(s: State, userId: string, patch: Partial<Pick<Version, "workshop" | "contributions">>, note: string): State {
  const u = userById(userId);
  if (!u || !canSeePlan(s, u)) throw new DomainError("Only club officers can change the plan.");
  if (ev(s).published) throw new DomainError("Volunteer sign-ups are already open, so the plan is locked.");
  const prev = current(s);
  const club = def(s).clubs.find((c) => isOfficer(u, c))!;
  const v: Version = { version: prev.version + 1, workshop: patch.workshop ?? prev.workshop, contributions: { ...prev.contributions, ...patch.contributions }, createdBy: userId, note };
  const msg: Msg = { id: `m${ev(s).messages.length + 1}`, kind: "note", club, version: v.version, body: note, deterministic: false };
  return put(s, { versions: [...ev(s).versions, v], messages: [...ev(s).messages, msg], log: log(s, `${label(u, club)} changed the plan (version ${v.version}), so earlier approvals were cleared`) });
}

export function canPublish(s: State) {
  const have = new Set(approvalsFor(s, current(s).version).map((a) => a.club));
  return def(s).clubs.every((c) => have.has(c)) && conflicts(s).length === 0;
}

export function publish(s: State, userId: string): State {
  const u = userById(userId);
  if (!u || !canPublishAs(s, u)) throw new DomainError(`Only the President, Vice President or Event coordinator of ${CLUBS[def(s).organizer].name} can open sign-ups.`);
  if (!canPublish(s)) throw new DomainError("Every club must approve the current plan first.");
  return put(s, { published: true, log: log(s, `${label(u, def(s).organizer)} opened volunteer sign-ups`) });
}

const overlap = (a: [number, number], b: [number, number]) => a[0] < b[1] && b[0] < a[1];
export const confirmedFor = (s: State, roleId: string) => ev(s).signups.filter((x) => x.roleId === roleId && x.status === "confirmed");

export function eligibility(s: State, userId: string, role: Role): string | null {
  const u = userById(userId);
  if (!u) return "Unknown student";
  if (!inEvent(s, u)) return "Join one of the host clubs first";
  if (role.skill && !u.skills.includes(role.skill)) return `Needs ${role.skill} experience`;
  if (u.available[0] > role.start || u.available[1] < role.end) return "You’re not free then";
  if (confirmedFor(s, role.id).some((x) => x.userId === userId)) return "Already signed up";
  for (const m of ev(s).signups.filter((x) => x.userId === userId && x.status === "confirmed")) {
    const r = ev(s).roles.find((r) => r.id === m.roleId)!;
    if (overlap([r.start, r.end], [role.start, role.end])) return `Overlaps your ${r.title} shift`;
  }
  if (confirmedFor(s, role.id).length >= role.capacity) return "Shift is full";
  return null;
}

export const recommend = (s: State, role: Role) => USERS.filter((u) => eligibility(s, u.id, role) === null);

export function confirmSignup(s: State, userId: string, roleId: string): State {
  if (!ev(s).published) throw new DomainError("Volunteer sign-ups aren’t open yet.");
  const role = ev(s).roles.find((r) => r.id === roleId);
  if (!role) throw new DomainError("Unknown shift");
  const why = eligibility(s, userId, role);
  if (why) throw new DomainError(why);
  const u = userById(userId)!;
  return put(s, { signups: [...ev(s).signups, { roleId, userId, status: "confirmed" }], lastCancelled: ev(s).lastCancelled === roleId ? undefined : ev(s).lastCancelled, log: log(s, `${u.name} signed up for ${role.title}`) });
}

export function cancelSignup(s: State, userId: string, roleId: string): State {
  const idx = ev(s).signups.findIndex((x) => x.roleId === roleId && x.userId === userId && x.status === "confirmed");
  if (idx < 0) throw new DomainError("You aren’t signed up for this shift.");
  const role = ev(s).roles.find((r) => r.id === roleId)!;
  return put(s, { signups: ev(s).signups.map((x, i) => (i === idx ? { ...x, status: "cancelled" as const } : x)), lastCancelled: roleId, log: log(s, `${userById(userId)!.name} cancelled ${role.title}, so a spot opened`) });
}

export const BRIEFS: Record<EventId, Partial<Record<ClubId, string>>> = {
  "hack-night": {
    coding: "We need $300 for pizza and prizes. We can put in $100 at most. Don’t tell the other clubs our limit. Most important: the event starts on time at 6:00 PM.",
    design: "We’ll run a 45-minute “design your app” workshop. Our members are in class until 6:00 PM, so we can’t start before 6:30 PM. Not negotiable.",
    startup: "We can pay up to $200 for pizza, but only if we get 5 minutes at the end to invite people to our pitch competition. If they say no, offer $80.",
  },
  "pitch-night": {
    startup: "We’ll book the atrium and invite 4 founders as judges. We can spend $150 on snacks. We’d love Coding Club members to help teams with demos.",
    coding: "We can send 3 members to help teams set up their demos from 6:30 PM. We can’t spend any money this month.",
  },
};

function hackNight(): EventState {
  const contributions = { coding: "Organizes, brings 4 mentors and $100", design: "45-minute design workshop", startup: "$200 for pizza, gets a 5-minute closing talk" };
  return {
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
    log: ["Maya (President) approved the first plan, but it changed, so that approval no longer counts"],
  };
}

function pitchNight(): EventState {
  return {
    versions: [{ version: 1, workshop: [t(19), t(21)], contributions: { startup: "Books the atrium, invites 4 founder judges, $150 for snacks", coding: "3 members help teams set up demos from 6:30 PM" }, createdBy: "u-jordan", note: "First plan from the agents" }],
    messages: [
      { id: "p1", kind: "proposal", club: "startup", version: 1, body: "Pitch Night next Thursday, 7–9 PM in the Business School Atrium. We bring 4 founder judges and $150 for snacks.", deterministic: true },
      { id: "p2", kind: "offer", club: "coding", version: 1, body: "We can’t spend money this month, but 3 of our members can help teams set up their demos from 6:30 PM.", deterministic: true },
    ],
    approvals: [],
    published: false,
    roles: [
      { id: "p-demo", title: "Demo helper", start: t(18, 30), end: t(20), capacity: 3, skill: "coding" },
      { id: "p-time", title: "Timekeeper", start: t(19), end: t(21), capacity: 1 },
    ],
    signups: [],
    log: ["The agents drafted a first plan"],
  };
}

export function initialState(): State {
  return { currentUserId: "u-maya", currentEventId: "hack-night", events: { "hack-night": hackNight(), "pitch-night": pitchNight() } };
}
