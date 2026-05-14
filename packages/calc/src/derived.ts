import { currentContractAmount, totalRevisedCost } from "./cost";
import {
  currentFYAdvanceRecovered,
  currentFYPaymentSoFar,
  effectiveMoneyOut,
} from "./payment";
import {
  currentFYBudgetExpenditureProgressPct,
  overallFinancialProgressPct,
} from "./progress";
import { currentFYSurplusDeficit } from "./budget";
import { deriveStatusFlags } from "./status";
import type { ProjectDerived, ProjectDerivedInputs } from "./types";

export function computeProjectDerived(
  input: ProjectDerivedInputs,
  today: Date = new Date(),
): ProjectDerived {
  const cca = currentContractAmount(input.originalContractPrice, input.latestVOAmount);
  const trc = totalRevisedCost({
    currentContractAmount: cca,
    priceEscalation: input.priceEscalation,
    contingencies: input.contingencies,
  });

  const fyPayment = currentFYPaymentSoFar({
    paymentTillDate: input.paymentTillDate,
    paymentTillLastFY: input.paymentTillLastFY,
  });
  const fyAdvanceRecovered = currentFYAdvanceRecovered({
    outstandingAdvanceTillLastFY: input.outstandingAdvanceTillLastFY,
    outstandingAdvanceTillDate: input.outstandingAdvanceTillDate,
  });
  const emo = effectiveMoneyOut({
    paymentTillDate: input.paymentTillDate,
    outstandingAdvanceTillDate: input.outstandingAdvanceTillDate,
  });

  const overallFin = overallFinancialProgressPct({
    effectiveMoneyOut: emo,
    totalRevisedCost: trc,
  });
  const fyExpenditure = currentFYBudgetExpenditureProgressPct({
    currentFYPaymentSoFar: fyPayment,
    currentFYBudget: input.currentFYBudget,
  });

  const surplus = currentFYSurplusDeficit({
    currentFYBudget: input.currentFYBudget,
    expectedPaymentTillFYEnd: input.expectedPaymentTillFYEnd,
  });

  const flags = deriveStatusFlags({
    status: input.status,
    effectiveCompletionDate: input.latestEoTDate ?? input.intendedCompletionDate,
    today,
    physicalProgress: input.physicalProgress,
    financialProgress: overallFin,
    outstandingAdvanceTillDate: input.outstandingAdvanceTillDate,
    currentFYSurplusDeficit: surplus,
  });

  return {
    currentContractAmount: cca,
    totalRevisedCost: trc,
    currentFYPaymentSoFar: fyPayment,
    currentFYAdvanceRecovered: fyAdvanceRecovered,
    effectiveMoneyOut: emo,
    overallFinancialProgressPct: overallFin,
    currentFYBudgetExpenditureProgressPct: fyExpenditure,
    currentFYSurplusDeficit: surplus,
    ...flags,
  };
}
