import { prisma } from "@pt/db";
import { getProjectScope } from "@pt/shared";

import { requireUser } from "@/lib/auth/guards";
import { buildCompletedProjectsWorkbook } from "@/lib/export/completed-projects";
import { reportFilename, writeWorkbookResponse } from "@/lib/export/workbook";

export async function GET() {
  const user = await requireUser();
  const scope = getProjectScope(user);

  const fy = await prisma.fiscalYear.findFirst({ where: { isCurrent: true } });
  const wb = await buildCompletedProjectsWorkbook(prisma, scope);

  return writeWorkbookResponse(
    wb,
    reportFilename("CompletedProjects", fy?.label ?? "unknown", new Date()),
  );
}
