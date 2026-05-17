import { prisma } from "@pt/db";

import { requireRole } from "@/lib/auth/guards";
import { buildBudgetPlanningWorkbook } from "@/lib/export/budget-planning";
import { reportFilename, writeWorkbookResponse } from "@/lib/export/workbook";

export async function GET() {
  await requireRole("PROJECT_MANAGER");

  const { wb, fyLabel } = await buildBudgetPlanningWorkbook(prisma);

  return writeWorkbookResponse(
    wb,
    reportFilename("BudgetPlanning", fyLabel, new Date()),
  );
}
