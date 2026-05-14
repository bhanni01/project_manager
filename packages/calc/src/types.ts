import Decimal from "decimal.js";

export type Money = Decimal | string | number;

export function toDecimal(value: Money | null | undefined): Decimal {
  if (value === null || value === undefined || value === "") return new Decimal(0);
  return new Decimal(value as Decimal.Value);
}

export interface ProjectDerivedInputs {
  originalContractPrice: Money;
  priceEscalation?: Money | null;
  contingencies?: Money | null;
  paymentTillDate: Money;
  paymentTillLastFY: Money;
  totalAdvancePayment: Money;
  outstandingAdvanceTillLastFY: Money;
  outstandingAdvanceTillDate: Money;
  currentFYBudget: Money;
  expectedPaymentTillFYEnd?: Money | null;
  physicalProgress: Money;
  status: "RUNNING" | "COMPLETED";
  intendedCompletionDate: Date;
  /** Most recent VO's revisedContractAmount, if any. Pass null until Step 5. */
  latestVOAmount?: Money | null;
  /** Most recent EoT's extendedToDate, if any. Pass null until Step 5. */
  latestEoTDate?: Date | null;
}

export interface ProjectDerived {
  currentContractAmount: Decimal;
  totalRevisedCost: Decimal;
  revisedCompletionDate: Date;
  totalEoTDays: number;
  currentFYPaymentSoFar: Decimal;
  currentFYAdvanceRecovered: Decimal;
  effectiveMoneyOut: Decimal;
  overallFinancialProgressPct: Decimal;
  currentFYBudgetExpenditureProgressPct: Decimal;
  currentFYSurplusDeficit: Decimal;
  isOverdue: boolean;
  isOverpaid: boolean;
  isAdvanceNotRecovered: boolean;
  isDeficit: boolean;
}
