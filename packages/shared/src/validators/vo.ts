import { z } from "zod";

import { adDate, moneyRequired } from "./common";

export const voCreateSchema = z.object({
  projectId: z.string().min(1),
  revisedContractAmount: moneyRequired,
  approvalDate: adDate,
  description: z.string().trim().min(1, "Required").max(2000),
});

export type VOCreateValues = z.infer<typeof voCreateSchema>;
