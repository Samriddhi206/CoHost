import { describe, expect, it } from "vitest";
import { approve, cancelSignup, canPublish, confirmSignup, initialState, propose, publish, recommend, DomainError, eligibility } from "./domain";

const approvedAll = () => {
  let s = initialState();
  s = approve(s, "u-priya", "photo", 2);
  s = approve(s, "u-marcus", "business", 2);
  s = approve(s, "u-lena", "art", 2);
  return s;
};

describe("approvals", () => {
  it("rejects approving a stale version", () => {
    expect(() => approve(initialState(), "u-priya", "photo", 1)).toThrow(DomainError);
  });
  it("rejects leader approving another club (role spoofing)", () => {
    expect(() => approve(initialState(), "u-marcus", "art", 2)).toThrow(/leader of this club/);
  });
  it("rejects non-leader member", () => {
    expect(() => approve(initialState(), "u-ava", "photo", 2)).toThrow();
  });
  it("new version invalidates approvals", () => {
    let s = approvedAll();
    expect(canPublish(s)).toBe(true);
    s = propose(s, "u-marcus", { contributions: { business: "$120" } } as never, "lower");
    expect(canPublish(s)).toBe(false);
  });
});

describe("publish", () => {
  it("only organizer leader can publish", () => {
    expect(() => publish(approvedAll(), "u-marcus")).toThrow(/organizing/);
    expect(publish(approvedAll(), "u-priya").published).toBe(true);
  });
  it("cannot publish without all approvals", () => {
    expect(() => publish(initialState(), "u-priya")).toThrow();
  });
});

describe("crew", () => {
  const pub = () => publish(approvedAll(), "u-priya");
  it("photographer requires photography skill", () => {
    const s = pub();
    expect(() => confirmSignup(s, "u-eli", "r-photo")).toThrow(/photography/);
  });
  it("prevents overbooking capacity 1", () => {
    let s = confirmSignup(pub(), "u-ava", "r-photo");
    expect(() => confirmSignup(s, "u-dev", "r-photo")).toThrow(/full/);
  });
  it("prevents overlapping shifts", () => {
    let s = confirmSignup(pub(), "u-ava", "r-checkin"); // 4:45–5:45
    expect(() => confirmSignup(s, "u-ava", "r-photo")).toThrow(/Overlaps/);
  });
  it("cancel reopens role and suggests without committing", () => {
    let s = confirmSignup(pub(), "u-ava", "r-photo");
    s = cancelSignup(s, "u-ava", "r-photo");
    const role = s.roles.find((r) => r.id === "r-photo")!;
    expect(recommend(s, role).map((u) => u.id)).toContain("u-dev");
    expect(s.signups.filter((x) => x.status === "confirmed")).toHaveLength(0);
    expect(eligibility(s, "u-dev", role)).toBeNull();
  });
});
