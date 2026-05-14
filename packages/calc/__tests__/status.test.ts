import { describe, expect, it } from "vitest";

import { deriveStatusFlags } from "../src/status";

const baseInput = {
  status: "RUNNING" as const,
  effectiveCompletionDate: new Date("2027-12-31"),
  today: new Date("2026-05-13"),
  physicalProgress: "40",
  financialProgress: "40",
  outstandingAdvanceTillDate: "0",
  currentFYSurplusDeficit: "1000",
};

describe("deriveStatusFlags", () => {
  it("is overdue when running past effective completion", () => {
    const flags = deriveStatusFlags({
      ...baseInput,
      effectiveCompletionDate: new Date("2025-01-01"),
    });
    expect(flags.isOverdue).toBe(true);
  });

  it("is not overdue when completed", () => {
    const flags = deriveStatusFlags({
      ...baseInput,
      status: "COMPLETED",
      effectiveCompletionDate: new Date("2025-01-01"),
    });
    expect(flags.isOverdue).toBe(false);
  });

  it("flags overpaid when financial > physical + 10", () => {
    expect(
      deriveStatusFlags({ ...baseInput, physicalProgress: "30", financialProgress: "41" })
        .isOverpaid,
    ).toBe(true);
    expect(
      deriveStatusFlags({ ...baseInput, physicalProgress: "30", financialProgress: "40" })
        .isOverpaid,
    ).toBe(false);
  });

  it("flags advance-not-recovered only after completion", () => {
    expect(
      deriveStatusFlags({ ...baseInput, status: "RUNNING", outstandingAdvanceTillDate: "500" })
        .isAdvanceNotRecovered,
    ).toBe(false);
    expect(
      deriveStatusFlags({ ...baseInput, status: "COMPLETED", outstandingAdvanceTillDate: "500" })
        .isAdvanceNotRecovered,
    ).toBe(true);
  });

  it("flags deficit when surplus < 0", () => {
    expect(
      deriveStatusFlags({ ...baseInput, currentFYSurplusDeficit: "-1" }).isDeficit,
    ).toBe(true);
    expect(
      deriveStatusFlags({ ...baseInput, currentFYSurplusDeficit: "0" }).isDeficit,
    ).toBe(false);
  });
});
