import { z } from "zod";

import { adDate } from "./common";

export const fiscalYearLabel = z
  .string()
  .trim()
  .regex(/^\d{4}\/\d{2}$/, "Format: NNNN/NN (e.g. 2083/84)");

export const rolloverInputSchema = z
  .object({
    nextLabel: fiscalYearLabel,
    startDate: adDate,
    endDate: adDate,
  })
  .refine((v) => v.startDate.getTime() < v.endDate.getTime(), {
    message: "Start date must be before end date",
    path: ["endDate"],
  });

export type RolloverInput = z.infer<typeof rolloverInputSchema>;
