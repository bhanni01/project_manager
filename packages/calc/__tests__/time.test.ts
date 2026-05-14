import { describe, expect, it } from "vitest";

import { totalEoTDays, totalRevisedCompletionDate } from "../src/time";

describe("totalRevisedCompletionDate", () => {
  it("returns the intended completion date when no EoT", () => {
    const intended = new Date("2027-06-30");
    expect(totalRevisedCompletionDate({ intendedCompletionDate: intended })).toEqual(intended);
    expect(
      totalRevisedCompletionDate({ intendedCompletionDate: intended, latestEoTDate: null }),
    ).toEqual(intended);
  });

  it("returns the latest EoT date when present", () => {
    const intended = new Date("2027-06-30");
    const eot = new Date("2027-09-30");
    expect(
      totalRevisedCompletionDate({ intendedCompletionDate: intended, latestEoTDate: eot }),
    ).toEqual(eot);
  });
});

describe("totalEoTDays", () => {
  it("returns 0 when there is no EoT", () => {
    expect(totalEoTDays({ intendedCompletionDate: new Date("2027-06-30") })).toBe(0);
  });

  it("returns the day delta between intended and latest EoT", () => {
    const intended = new Date("2027-06-30T00:00:00Z");
    const eot = new Date("2027-09-30T00:00:00Z");
    expect(totalEoTDays({ intendedCompletionDate: intended, latestEoTDate: eot })).toBe(92);
  });

  it("is negative when the EoT date is before intended (degenerate input)", () => {
    const intended = new Date("2027-06-30T00:00:00Z");
    const eot = new Date("2027-06-20T00:00:00Z");
    expect(totalEoTDays({ intendedCompletionDate: intended, latestEoTDate: eot })).toBe(-10);
  });
});
