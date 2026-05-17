import { prisma } from "@pt/db";

import { requireUser } from "@/lib/auth/guards";
import { buildSingleProjectWorkbook } from "@/lib/export/single-project";
import { reportFilename, writeWorkbookResponse } from "@/lib/export/workbook";
import { findScopedProjectOr404 } from "@/lib/project/scope";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const project = await findScopedProjectOr404(user, id);

  const fy = await prisma.fiscalYear.findFirst({ where: { isCurrent: true } });
  const { wb } = await buildSingleProjectWorkbook(prisma, project.id);

  const shortId = project.id.slice(-6);
  const filename = reportFilename(
    `SingleProject_${shortId}`,
    fy?.label ?? "unknown",
    new Date(),
  );
  return writeWorkbookResponse(wb, filename);
}
