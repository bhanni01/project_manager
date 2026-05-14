import Decimal from "decimal.js";

import { type Money, toDecimal } from "./types";

/** (Effective Money Out / Total Revised Cost) × 100. Returns Decimal(0) if cost is zero. */
export function overallFinancialProgressPct(args: {
  effectiveMoneyOut: Money;
  totalRevisedCost: Money;
}): Decimal {
  const cost = toDecimal(args.totalRevisedCost);
  if (cost.isZero()) return new Decimal(0);
  return toDecimal(args.effectiveMoneyOut).dividedBy(cost).times(100);
}

/** (Current FY Payment So Far / Current FY Budget) × 100. Returns Decimal(0) if budget is zero. */
export function currentFYBudgetExpenditureProgressPct(args: {
  currentFYPaymentSoFar: Money;
  currentFYBudget: Money;
}): Decimal {
  const budget = toDecimal(args.currentFYBudget);
  if (budget.isZero()) return new Decimal(0);
  return toDecimal(args.currentFYPaymentSoFar).dividedBy(budget).times(100);
}
