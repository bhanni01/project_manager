import { z } from "zod";

import { adDate } from "./common";

export const eotCreateSchema = z.object({
  projectId: z.string().min(1),
  extendedToDate: adDate,
  approvalDate: adDate,
  reason: z.string().trim().min(1, "Required").max(2000),
});

export type EoTCreateValues = z.infer<typeof eotCreateSchema>;
