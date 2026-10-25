import { describe, expect, it } from "vitest";
import { approve, cancelSignup, canPublish, canSeePlan, confirmSignup, DomainError, eligibility, initialState, propose, publish, recommend, roster, userById, type State } from "./domain";

const approvedAll = () => {
  let s = initialState();
  s = approve(s, "u-maya", "coding", 2);
  s = approve(s, "u-leo", "design", 2);
  s = approve(s, "u-ben", "startup", 2); // a Budget officer is an officer too
  return s;
};

describe("roles", () => {
  it("lists each club's people from most senior role down", () => {
    expect(roster("coding").map((u) => u.name)).toEqual(["Maya", "Ava", "Chloe", "Dev", "Eli"]);
  });
  it("members see only the basics; officers see the plan", () => {
    const s = initialState();
    expect(canSeePlan(s, userById("u-eli")!)).toBe(false);
    expect(canSeePlan(s, userById("u-ava")!)).toBe(true);
  });
});

describe("approvals", () => {
  it("rejects approving a stale version", () => {
    expect(() => approve(initialState(), "u-maya", "coding", 1)).toThrow(DomainError);
  });
  it("rejects an officer approving another club", () => {
    expect(() => approve(initialState(), "u-jordan", "design", 2)).toThrow(/officer of Design Club/);
  });
  it("rejects a plain member", () => {
    expect(() => approve(initialState(), "u-eli", "coding", 2)).toThrow();
  });
  it("a new version clears approvals", () => {
    let s = approvedAll();
    expect(canPublish(s)).toBe(true);
    s = propose(s, "u-jordan", { contributions: { startup: "$120" } }, "lower");
    expect(canPublish(s)).toBe(false);
  });
});

describe("publish", () => {
  it("only an organizing-club lead can open sign-ups", () => {
    expect(() => publish(approvedAll(), "u-jordan")).toThrow(/Coding Club/);
    expect(() => publish(approvedAll(), "u-ava")).toThrow(); // Budget officer can approve but not open sign-ups
    expect(publish(approvedAll(), "u-maya").events["hack-night"].published).toBe(true);
  });
  it("cannot open sign-ups without every approval", () => {
    expect(() => publish(initialState(), "u-maya")).toThrow();
  });
});

describe("volunteers", () => {
  const pub = (): State => publish(approvedAll(), "u-maya");
  const role = (s: State, id: string) => s.events["hack-night"].roles.find((r) => r.id === id)!;
  it("mentor shift needs coding experience", () => {
    expect(() => confirmSignup(pub(), "u-eli", "r-mentor")).toThrow(/coding/);
  });
  it("prevents overbooking a 1-person shift", () => {
    const s = confirmSignup(pub(), "u-ava", "r-mentor");
    expect(() => confirmSignup(s, "u-dev", "r-mentor")).toThrow(/full/);
  });
  it("prevents overlapping shifts", () => {
    const s = confirmSignup(pub(), "u-ava", "r-checkin"); // 6:00–7:00 overlaps mentor 6:30–9:00
    expect(() => confirmSignup(s, "u-ava", "r-mentor")).toThrow(/Overlaps/);
  });
  it("cancelling reopens the spot and suggests people without signing them up", () => {
    let s = confirmSignup(pub(), "u-ava", "r-mentor");
    s = cancelSignup(s, "u-ava", "r-mentor");
    expect(recommend(s, role(s, "r-mentor")).map((u) => u.id)).toContain("u-dev");
    expect(s.events["hack-night"].signups.filter((x) => x.status === "confirmed")).toHaveLength(0);
    expect(eligibility(s, "u-dev", role(s, "r-mentor"))).toBeNull();
  });
});
