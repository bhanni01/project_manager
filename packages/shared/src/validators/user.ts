import { z } from "zod";

export const userCreateSchema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  role: z.enum(["ENGINEER", "PROJECT_MANAGER"]),
});
export type UserCreateValues = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Required").max(120),
  role: z.enum(["ENGINEER", "PROJECT_MANAGER"]),
});
export type UserUpdateValues = z.infer<typeof userUpdateSchema>;

export const userIdSchema = z.object({ id: z.string().min(1) });
