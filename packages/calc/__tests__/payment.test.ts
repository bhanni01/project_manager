import { describe, expect, it } from "vitest";

import {
  currentFYAdvanceRecovered,
  currentFYPaymentSoFar,
  effectiveMoneyOut,
} from "../src/payment";

describe("currentFYPaymentSoFar", () => {
  it("subtracts last FY's payment from till-date", () => {
    expect(
      currentFYPaymentSoFar({ paymentTillDate: "2500000", paymentTillLastFY: "1000000" }).toString(),
    ).toBe("1500000");
  });

  it("can be zero or negative", () => {
    expect(
      currentFYPaymentSoFar({ paymentTillDate: "1000000", paymentTillLastFY: "1000000" }).toString(),
    ).toBe("0");
    expect(
      currentFYPaymentSoFar({ paymentTillDate: "900000", paymentTillLastFY: "1000000" }).toString(),
    ).toBe("-100000");
  });
});

describe("currentFYAdvanceRecovered", () => {
  it("is opening − closing outstanding advance", () => {
    expect(
      currentFYAdvanceRecovered({
        outstandingAdvanceTillLastFY: "500000",
        outstandingAdvanceTillDate: "200000",
      }).toString(),
    ).toBe("300000");
  });
});

describe("effectiveMoneyOut", () => {
  it("sums payments and outstanding advance", () => {
    expect(
      effectiveMoneyOut({
        paymentTillDate: "2500000",
        outstandingAdvanceTillDate: "500000",
      }).toString(),
    ).toBe("3000000");
  });
});
