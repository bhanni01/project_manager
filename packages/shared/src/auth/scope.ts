import type { Prisma } from "@pt/db";
import type { SessionUser } from "./role";

/**
 * Returns the Prisma `where` fragment that scopes Project queries to the
 * current user. PMs see everything; engineers only see projects they own.
 *
 * Use this on EVERY Project query (read AND write). Mutations should also
 * call assertCanEditProject() before saving.
 */
export function getProjectScope(user: SessionUser): Prisma.ProjectWhereInput {
  if (user.role === "PROJECT_MANAGER") return {};
  return { engineerId: user.id };
}
