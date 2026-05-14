import { describe, expect, it } from "vitest";

import {
  currentFYBudgetExpenditureProgressPct,
  overallFinancialProgressPct,
} from "../src/progress";

describe("overallFinancialProgressPct", () => {
  it("returns (emo / cost) * 100", () => {
    expect(
      overallFinancialProgressPct({
        effectiveMoneyOut: "3000000",
        totalRevisedCost: "10000000",
      }).toString(),
    ).toBe("30");
  });

  it("returns 0 when cost is zero", () => {
    expect(
      overallFinancialProgressPct({
        effectiveMoneyOut: "1000",
        totalRevisedCost: "0",
      }).toString(),
    ).toBe("0");
  });
});

describe("currentFYBudgetExpenditureProgressPct", () => {
  it("returns (payment / budget) * 100", () => {
    expect(
      currentFYBudgetExpenditureProgressPct({
        currentFYPaymentSoFar: "1500000",
        currentFYBudget: "5000000",
      }).toString(),
    ).toBe("30");
  });

  it("returns 0 when budget is zero", () => {
    expect(
      currentFYBudgetExpenditureProgressPct({
        currentFYPaymentSoFar: "1500000",
        currentFYBudget: "0",
      }).toString(),
    ).toBe("0");
  });
});
