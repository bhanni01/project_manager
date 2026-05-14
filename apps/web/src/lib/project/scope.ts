import { notFound } from "next/navigation";

import { prisma, type Project } from "@pt/db";
import type { SessionUser } from "@pt/shared";
import { getProjectScope } from "@pt/shared";

/**
 * Load a project that the user is allowed to see. Returns 404 if the project
 * doesn't exist OR the user can't see it — we deliberately don't reveal the
 * distinction to avoid leaking ownership.
 */
export async function findScopedProjectOr404(
  user: SessionUser,
  id: string,
): Promise<Project> {
  const scope = getProjectScope(user);
  const project = await prisma.project.findFirst({
    where: { AND: [{ id }, scope] },
  });
  if (!project) notFound();
  return project;
}

/**
 * Same as findScopedProjectOr404 but additionally enforces edit rules:
 * engineers can only edit their own *non-archived* projects; PM can edit any
 * non-archived project. Archived projects are read-only until restored.
 */
export async function findEditableProjectOr404(
  user: SessionUser,
  id: string,
): Promise<Project> {
  const project = await findScopedProjectOr404(user, id);
  if (project.isArchived) notFound();
  return project;
}
