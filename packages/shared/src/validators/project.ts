import { z } from "zod";

import { adDate, moneyOptional, moneyRequired, percent } from "./common";

export const projectFormSchema = z.object({
  projectName: z.string().min(1, "Required").max(200),
  infrastructureType: z.enum(["ROAD", "BRIDGE"]),
  projectType: z.enum(["MULTIYEAR", "SOURCE_APPROVED", "YEARLY_TENDERED"]),

  originalContractPrice: moneyRequired,
  priceEscalation: moneyOptional,
  contingencies: moneyOptional,

  contractDate: adDate,
  intendedCompletionDate: adDate,

  paymentTillLastFY: moneyRequired,
  paymentTillDate: moneyRequired,

  totalAdvancePayment: moneyRequired,
  outstandingAdvanceTillLastFY: moneyRequired,
  outstandingAdvanceTillDate: moneyRequired,

  currentFYBudget: moneyRequired,
  expectedPaymentTillFYEnd: moneyOptional,
  expectedOutstandingAdvanceFYEnd: moneyOptional,
  nextFYBudgetRequirement: moneyOptional,

  physicalProgress: percent,

  /** Set on create by engineer-owns rule; on edit only PM can change. */
  engineerId: z.string().min(1).optional(),

  /** On edit, status can be flipped. On create defaults to RUNNING server-side. */
  status: z.enum(["RUNNING", "COMPLETED"]).optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const projectIdSchema = z.object({ id: z.string().min(1) });
export const projectReassignSchema = z.object({
  id: z.string().min(1),
  engineerId: z.string().min(1),
});
