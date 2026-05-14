import { z } from "zod";

/** Money entered as a string; must be a non-negative decimal. Empty → 0. */
export const moneyRequired = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? "0" : v),
  z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Enter a non-negative number")
    .refine((s) => Number.parseFloat(s) >= 0, { message: "Must be ≥ 0" }),
);

export const moneyOptional = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Enter a non-negative number")
    .optional(),
);

export const percent = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? "0" : v),
  z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Enter a number between 0 and 100")
    .refine((s) => {
      const n = Number.parseFloat(s);
      return n >= 0 && n <= 100;
    }, "Must be between 0 and 100"),
);

export const adDate = z.preprocess((v) => {
  if (v instanceof Date) return v;
  if (typeof v === "string" && v.length > 0) return new Date(v);
  return undefined;
}, z.date());
