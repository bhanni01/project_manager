import type Decimal from "decimal.js";

import { type Money, toDecimal } from "./types";

/** Contract Payment till Date − Contract Payment till Last FY. */
export function currentFYPaymentSoFar(args: {
  paymentTillDate: Money;
  paymentTillLastFY: Money;
}): Decimal {
  return toDecimal(args.paymentTillDate).minus(toDecimal(args.paymentTillLastFY));
}

/** Outstanding Advance till Last FY − Outstanding Advance till Date. */
export function currentFYAdvanceRecovered(args: {
  outstandingAdvanceTillLastFY: Money;
  outstandingAdvanceTillDate: Money;
}): Decimal {
  return toDecimal(args.outstandingAdvanceTillLastFY).minus(
    toDecimal(args.outstandingAdvanceTillDate),
  );
}

/** Contract Payment till Date + Outstanding Advance Payment till Date. */
export function effectiveMoneyOut(args: {
  paymentTillDate: Money;
  outstandingAdvanceTillDate: Money;
}): Decimal {
  return toDecimal(args.paymentTillDate).plus(toDecimal(args.outstandingAdvanceTillDate));
}
