import type Decimal from "decimal.js";

import { type Money, toDecimal } from "./types";

/** Current FY Budget − Expected Contract Payment till End of Current FY. */
export function currentFYSurplusDeficit(args: {
  currentFYBudget: Money;
  expectedPaymentTillFYEnd?: Money | null;
}): Decimal {
  return toDecimal(args.currentFYBudget).minus(toDecimal(args.expectedPaymentTillFYEnd));
}
