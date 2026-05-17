import { prisma } from "@pt/db";

import { requireRole } from "@/lib/auth/guards";
import { buildOfficeDashboardWorkbook } from "@/lib/export/office-dashboard";
import { reportFilename, writeWorkbookResponse } from "@/lib/export/workbook";

export async function GET() {
  await requireRole("PROJECT_MANAGER");

  const { wb, fyLabel } = await buildOfficeDashboardWorkbook(prisma);

  return writeWorkbookResponse(
    wb,
    reportFilename("OfficeDashboard", fyLabel, new Date()),
  );
}
