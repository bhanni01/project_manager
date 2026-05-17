import ExcelJS from "exceljs";

import type { prisma as PrismaClient } from "@pt/db";

import {
  NEPALI_CURRENCY,
  PERCENT,
  applyColorScale,
  asNumber,
  makeSheet,
} from "./workbook";

export async function buildOfficeDashboardWorkbook(
  prisma: typeof PrismaClient,
): Promise<{ wb: ExcelJS.Workbook; fyLabel: string }> {
  const [
    currentFY,
    runningCount,
    completedCount,
    archivedCount,
    engineerCount,
    projects,
    fyHistory,
  ] = await Promise.all([
    prisma.fiscalYear.findFirst({ where: { isCurrent: true } }),
    prisma.project.count({ where: { isArchived: false, status: "RUNNING" } }),
    prisma.project.count({ where: { isArchived: false, status: "COMPLETED" } }),
    prisma.project.count({ where: { isArchived: true } }),
    prisma.user.count({ where: { role: "ENGINEER", isActive: true } }),
    prisma.project.findMany({
      where: { isArchived: false },
      include: { engineer: { select: { id: true, name: true } } },
    }),
    prisma.fiscalYear.findMany({
      include: { snapshots: { select: { fyPayment: true, fyBudget: true, surplusDeficit: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Project Tracker";
  wb.created = new Date();

  // ----- Sheet 1: KPIs ------------------------------------------------------
  const kpis = makeSheet(wb, "KPIs", [
    { key: "k", header: "Metric", width: 38 },
    { key: "v", header: "Value", width: 24 },
  ]);

  const totalBudget = projects.reduce((sum, p) => sum + asNumber(p.currentFYBudget), 0);
  const totalPaymentTillDate = projects.reduce(
    (sum, p) => sum + asNumber(p.paymentTillDate),
    0,
  );
  const avgPhysical =
    projects.length === 0
      ? 0
      : projects.reduce((sum, p) => sum + asNumber(p.physicalProgress), 0) / projects.length;

  kpis.addRow({ k: "Current fiscal year", v: currentFY?.label ?? "—" });
  kpis.addRow({ k: "Active projects (running)", v: runningCount });
  kpis.addRow({ k: "Completed projects", v: completedCount });
  kpis.addRow({ k: "Archived projects", v: archivedCount });
  kpis.addRow({ k: "Engineers (active)", v: engineerCount });
  kpis.addRow({});
  const t1 = kpis.addRow({ k: "Total current FY budget", v: totalBudget });
  t1.getCell("v").numFmt = NEPALI_CURRENCY;
  const t2 = kpis.addRow({ k: "Total payment till date", v: totalPaymentTillDate });
  t2.getCell("v").numFmt = NEPALI_CURRENCY;
  const t3 = kpis.addRow({ k: "Average physical progress", v: avgPhysical });
  t3.getCell("v").numFmt = PERCENT;

  // ----- Sheet 2: Per Engineer ----------------------------------------------
  const perEng = makeSheet(wb, "Per Engineer", [
    { key: "engineer", header: "Engineer", width: 30 },
    { key: "running", header: "Running", width: 12 },
    { key: "completed", header: "Completed", width: 12 },
    { key: "archived", header: "Archived", width: 12 },
    { key: "contractTotal", header: "Original contract total", width: 24, numFmt: NEPALI_CURRENCY },
  ]);

  const perEngineer = new Map<
    string,
    {
      name: string;
      running: number;
      completed: number;
      archived: number;
      contractTotal: number;
    }
  >();
  // Pull archived projects too for the per-engineer "archived" count.
  const allProjects = await prisma.project.findMany({
    include: { engineer: { select: { id: true, name: true } } },
  });
  for (const p of allProjects) {
    if (!p.engineer) continue;
    const entry = perEngineer.get(p.engineer.id) ?? {
      name: p.engineer.name,
      running: 0,
      completed: 0,
      archived: 0,
      contractTotal: 0,
    };
    if (p.isArchived) entry.archived++;
    else if (p.status === "RUNNING") entry.running++;
    else entry.completed++;
    entry.contractTotal += asNumber(p.originalContractPrice);
    perEngineer.set(p.engineer.id, entry);
  }
  for (const e of perEngineer.values()) {
    perEng.addRow({
      engineer: e.name,
      running: e.running,
      completed: e.completed,
      archived: e.archived,
      contractTotal: e.contractTotal,
    });
  }

  // ----- Sheet 3: FY Trend --------------------------------------------------
  const trend = makeSheet(wb, "FY Trend", [
    { key: "label", header: "Fiscal year", width: 14 },
    { key: "count", header: "Snapshots", width: 12 },
    { key: "fyPayment", header: "Total FY payment", width: 24, numFmt: NEPALI_CURRENCY },
    { key: "fyBudget", header: "Total FY budget", width: 24, numFmt: NEPALI_CURRENCY },
    { key: "surplus", header: "Total surplus / deficit", width: 26, numFmt: NEPALI_CURRENCY },
  ]);
  for (const fy of fyHistory) {
    const total = fy.snapshots.reduce(
      (acc, s) => ({
        fyPayment: acc.fyPayment + asNumber(s.fyPayment),
        fyBudget: acc.fyBudget + asNumber(s.fyBudget),
        surplus: acc.surplus + asNumber(s.surplusDeficit),
      }),
      { fyPayment: 0, fyBudget: 0, surplus: 0 },
    );
    trend.addRow({
      label: fy.label,
      count: fy.snapshots.length,
      fyPayment: total.fyPayment,
      fyBudget: total.fyBudget,
      surplus: total.surplus,
    });
  }
  if (fyHistory.length > 0) {
    applyColorScale(trend, `E2:E${fyHistory.length + 1}`, "surplus");
  }

  return { wb, fyLabel: currentFY?.label ?? "unknown" };
}
