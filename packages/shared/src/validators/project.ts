import { z } from "zod";

/** Empty string → undefined; otherwise pass through. */
const emptyStringToUndefined = z.preprocess((v) => (v === "" ? undefined : v), z.unknown());

/** Money entered as a string; must be a non-negative decimal. Empty → 0. */
const moneyRequired = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? "0" : v),
  z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Enter a non-negative number")
    .refine((s) => Number.parseFloat(s) >= 0, { message: "Must be ≥ 0" }),
);

const moneyOptional = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Enter a non-negative number")
    .optional(),
);

const percent = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? "0" : v),
  z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Enter a number between 0 and 100")
    .refine((s) => {
      const n = Number.parseFloat(s);
      return n >= 0 && n <= 100;
    }, "Must be between 0 and 100"),
);

const adDate = z.preprocess((v) => {
  if (v instanceof Date) return v;
  if (typeof v === "string" && v.length > 0) return new Date(v);
  return undefined;
}, z.date());

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
export const projectReassignSchema = z.object({ id: z.string().min(1), engineerId: z.string().min(1) });

/* Exporting the helper so unused-export linters stay quiet. */
export { emptyStringToUndefined };
