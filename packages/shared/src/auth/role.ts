import type { Role } from "@pt/db";

export type { Role };

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}
