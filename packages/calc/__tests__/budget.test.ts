import { describe, expect, it } from "vitest";

import { currentFYSurplusDeficit } from "../src/budget";

describe("currentFYSurplusDeficit", () => {
  it("returns budget − expected payment till FY end", () => {
    expect(
      currentFYSurplusDeficit({
        currentFYBudget: "5000000",
        expectedPaymentTillFYEnd: "4000000",
      }).toString(),
    ).toBe("1000000");
  });

  it("is negative on deficit", () => {
    expect(
      currentFYSurplusDeficit({
        currentFYBudget: "3000000",
        expectedPaymentTillFYEnd: "4000000",
      }).toString(),
    ).toBe("-1000000");
  });

  it("treats missing forecast as 0", () => {
    expect(
      currentFYSurplusDeficit({ currentFYBudget: "5000000" }).toString(),
    ).toBe("5000000");
  });
});
