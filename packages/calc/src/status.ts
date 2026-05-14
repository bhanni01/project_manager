import { type Money, toDecimal } from "./types";

export interface StatusFlagsInput {
  status: "RUNNING" | "COMPLETED";
  /** Use intendedCompletionDate until Step 5 lands EoTs; thereafter, latest EoT date. */
  effectiveCompletionDate: Date;
  today: Date;
  physicalProgress: Money;
  financialProgress: Money;
  outstandingAdvanceTillDate: Money;
  currentFYSurplusDeficit: Money;
}

export interface StatusFlags {
  isOverdue: boolean;
  isOverpaid: boolean;
  isAdvanceNotRecovered: boolean;
  isDeficit: boolean;
}

export function deriveStatusFlags(input: StatusFlagsInput): StatusFlags {
  const physical = toDecimal(input.physicalProgress);
  const financial = toDecimal(input.financialProgress);
  const surplus = toDecimal(input.currentFYSurplusDeficit);
  const outstandingAdvance = toDecimal(input.outstandingAdvanceTillDate);

  const isOverdue =
    input.status === "RUNNING" && input.effectiveCompletionDate.getTime() < input.today.getTime();

  const isOverpaid = financial.minus(physical).greaterThan(10);

  const isAdvanceNotRecovered =
    input.status === "COMPLETED" && outstandingAdvance.greaterThan(0);

  const isDeficit = surplus.lessThan(0);

  return { isOverdue, isOverpaid, isAdvanceNotRecovered, isDeficit };
}
