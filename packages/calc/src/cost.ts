import type Decimal from "decimal.js";

import { type Money, toDecimal } from "./types";

/**
 * Latest VO contract amount, or the original contract price if no VO exists.
 * CLAUDE.md §6.
 */
export function currentContractAmount(
  originalContractPrice: Money,
  latestVOAmount: Money | null | undefined,
): Decimal {
  if (latestVOAmount !== null && latestVOAmount !== undefined && latestVOAmount !== "") {
    return toDecimal(latestVOAmount);
  }
  return toDecimal(originalContractPrice);
}

/**
 * Current Contract Amount + Price Escalation + Contingencies.
 */
export function totalRevisedCost(args: {
  currentContractAmount: Money;
  priceEscalation?: Money | null;
  contingencies?: Money | null;
}): Decimal {
  return toDecimal(args.currentContractAmount)
    .plus(toDecimal(args.priceEscalation))
    .plus(toDecimal(args.contingencies));
}
