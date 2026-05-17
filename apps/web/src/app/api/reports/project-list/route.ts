import { prisma } from "@pt/db";
import { getProjectScope } from "@pt/shared";

import { requireUser } from "@/lib/auth/guards";
import {
  buildProjectListWorkbook,
  type ProjectListFilters,
} from "@/lib/export/project-list";
import { reportFilename, writeWorkbookResponse } from "@/lib/export/workbook";

export async function GET(req: Request) {
  const user = await requireUser();
  const scope = getProjectScope(user);

  const url = new URL(req.url);
  const filters: ProjectListFilters = {};
  const infrastructure = url.searchParams.get("infrastructure");
  if (infrastructure === "ROAD" || infrastructure === "BRIDGE") {
    filters.infrastructure = infrastructure;
  }
  const projectType = url.searchParams.get("type");
  if (
    projectType === "MULTIYEAR" ||
    projectType === "SOURCE_APPROVED" ||
    projectType === "YEARLY_TENDERED"
  ) {
    filters.projectType = projectType;
  }
  const engineerId = url.searchParams.get("engineerId");
  if (engineerId && user.role === "PROJECT_MANAGER") {
    filters.engineerId = engineerId;
  }

  const fy = await prisma.fiscalYear.findFirst({ where: { isCurrent: true } });
  const wb = await buildProjectListWorkbook(prisma, scope, filters);

  return writeWorkbookResponse(
    wb,
    reportFilename("ProjectList", fy?.label ?? "unknown", new Date()),
  );
}
