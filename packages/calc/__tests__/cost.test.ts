import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";

import { currentContractAmount, totalRevisedCost } from "../src/cost";

describe("currentContractAmount", () => {
  it("uses originalContractPrice when there is no VO", () => {
    expect(currentContractAmount("10000000", null).toString()).toBe("10000000");
    expect(currentContractAmount("10000000", undefined).toString()).toBe("10000000");
  });

  it("uses latest VO amount when present", () => {
    expect(currentContractAmount("10000000", "12500000").toString()).toBe("12500000");
  });

  it("accepts numbers and Decimal inputs", () => {
    expect(currentContractAmount(10_000_000, null).toString()).toBe("10000000");
    expect(currentContractAmount(new Decimal("10000000"), new Decimal("9000000")).toString()).toBe(
      "9000000",
    );
  });
});

describe("totalRevisedCost", () => {
  it("sums current contract + escalation + contingencies", () => {
    expect(
      totalRevisedCost({
        currentContractAmount: "10000000",
        priceEscalation: "500000",
        contingencies: "250000",
      }).toString(),
    ).toBe("10750000");
  });

  it("treats null/undefined escalation and contingencies as 0", () => {
    expect(totalRevisedCost({ currentContractAmount: "10000000" }).toString()).toBe("10000000");
    expect(
      totalRevisedCost({
        currentContractAmount: "10000000",
        priceEscalation: null,
        contingencies: undefined,
      }).toString(),
    ).toBe("10000000");
  });
});
