import { redirect } from "next/navigation";

import type { Role } from "@pt/db";
import type { SessionUser } from "@pt/shared";

import { auth } from "@/auth";

/**
 * Returns the current SessionUser, or redirects to /login.
 * Use inside Server Components and Server Actions.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role,
  };
}

/**
 * Returns the current SessionUser if their role matches, else redirects
 * to /dashboard (the role-agnostic landing page).
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) {
    redirect("/dashboard");
  }
  return user;
}
