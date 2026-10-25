import { describe, expect, it } from "vitest";
import { approve, cancelSignup, canPublish, confirmSignup, initialState, propose, publish, recommend, DomainError, eligibility } from "./domain";

const approvedAll = () => {
  let s = initialState();
  s = approve(s, "u-maya", "coding", 2);
  s = approve(s, "u-jordan", "startup", 2);
  s = approve(s, "u-leo", "design", 2);
  return s;
};

describe("approvals", () => {
  it("rejects approving a stale version", () => {
    expect(() => approve(initialState(), "u-maya", "coding", 1)).toThrow(DomainError);
  });
  it("rejects leader approving another club (role spoofing)", () => {
    expect(() => approve(initialState(), "u-jordan", "design", 2)).toThrow(/Only a leader of Design Club/);
  });
  it("rejects non-leader member", () => {
    expect(() => approve(initialState(), "u-ava", "coding", 2)).toThrow();
  });
  it("new version invalidates approvals", () => {
    let s = approvedAll();
    expect(canPublish(s)).toBe(true);
    s = propose(s, "u-jordan", { contributions: { startup: "$120" } } as never, "lower");
    expect(canPublish(s)).toBe(false);
  });
});

describe("publish", () => {
  it("only organizer leader can publish", () => {
    expect(() => publish(approvedAll(), "u-jordan")).toThrow(/organizing/);
    expect(publish(approvedAll(), "u-maya").published).toBe(true);
  });
  it("cannot publish without all approvals", () => {
    expect(() => publish(initialState(), "u-maya")).toThrow();
  });
});

describe("crew", () => {
  const pub = () => publish(approvedAll(), "u-maya");
  it("mentor requires coding skill", () => {
    const s = pub();
    expect(() => confirmSignup(s, "u-eli", "r-mentor")).toThrow(/coding/);
  });
  it("prevents overbooking capacity 1", () => {
    let s = confirmSignup(pub(), "u-ava", "r-mentor");
    expect(() => confirmSignup(s, "u-dev", "r-mentor")).toThrow(/full/);
  });
  it("prevents overlapping shifts", () => {
    let s = confirmSignup(pub(), "u-ava", "r-checkin"); // 6:00–7:00 overlaps mentor 6:30–9:00
    expect(() => confirmSignup(s, "u-ava", "r-mentor")).toThrow(/Overlaps/);
  });
  it("cancel reopens role and suggests without committing", () => {
    let s = confirmSignup(pub(), "u-ava", "r-mentor");
    s = cancelSignup(s, "u-ava", "r-mentor");
    const role = s.roles.find((r) => r.id === "r-mentor")!;
    expect(recommend(s, role).map((u) => u.id)).toContain("u-dev");
    expect(s.signups.filter((x) => x.status === "confirmed")).toHaveLength(0);
    expect(eligibility(s, "u-dev", role)).toBeNull();
  });
});
