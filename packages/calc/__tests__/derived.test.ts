import { describe, expect, it } from "vitest";

import { computeProjectDerived } from "../src/derived";

describe("computeProjectDerived", () => {
  it("matches the worked example from the plan", () => {
    // originalContractPrice 10_000_000; payments 2_500_000 / lastFY 1_000_000;
    // budget 5_000_000 → currentFYPaymentSoFar = 1_500_000, fyExpenditure = 30%.
    const result = computeProjectDerived(
      {
        originalContractPrice: "10000000",
        priceEscalation: null,
        contingencies: null,
        paymentTillDate: "2500000",
        paymentTillLastFY: "1000000",
        totalAdvancePayment: "0",
        outstandingAdvanceTillLastFY: "0",
        outstandingAdvanceTillDate: "0",
        currentFYBudget: "5000000",
        expectedPaymentTillFYEnd: "4000000",
        physicalProgress: "30",
        status: "RUNNING",
        intendedCompletionDate: new Date("2027-12-31"),
      },
      new Date("2026-05-13"),
    );

    expect(result.currentContractAmount.toString()).toBe("10000000");
    expect(result.totalRevisedCost.toString()).toBe("10000000");
    expect(result.currentFYPaymentSoFar.toString()).toBe("1500000");
    expect(result.effectiveMoneyOut.toString()).toBe("2500000");
    expect(result.overallFinancialProgressPct.toString()).toBe("25");
    expect(result.currentFYBudgetExpenditureProgressPct.toString()).toBe("30");
    expect(result.currentFYSurplusDeficit.toString()).toBe("1000000");
    expect(result.isOverdue).toBe(false);
    expect(result.isDeficit).toBe(false);
  });

  it("prefers latest VO over original contract price", () => {
    const result = computeProjectDerived({
      originalContractPrice: "10000000",
      latestVOAmount: "12500000",
      paymentTillDate: "0",
      paymentTillLastFY: "0",
      totalAdvancePayment: "0",
      outstandingAdvanceTillLastFY: "0",
      outstandingAdvanceTillDate: "0",
      currentFYBudget: "0",
      physicalProgress: "0",
      status: "RUNNING",
      intendedCompletionDate: new Date("2030-01-01"),
    });
    expect(result.currentContractAmount.toString()).toBe("12500000");
  });
});
