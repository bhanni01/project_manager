import ExcelJS from "exceljs";

import type { prisma as PrismaClient } from "@pt/db";

import {
  NEPALI_CURRENCY,
  applyColorScale,
  asNumber,
  makeSheet,
} from "./workbook";

export async function buildBudgetPlanningWorkbook(
  prisma: typeof PrismaClient,
): Promise<{ wb: ExcelJS.Workbook; fyLabel: string }> {
  const [currentFY, projects] = await Promise.all([
    prisma.fiscalYear.findFirst({ where: { isCurrent: true } }),
    prisma.project.findMany({
      where: { isArchived: false },
      include: { engineer: { select: { name: true } } },
      orderBy: { projectName: "asc" },
    }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Project Tracker";
  wb.created = new Date();

  // ----- Sheet 1: FY Plan ----------------------------------------------------
  const plan = makeSheet(wb, "FY Plan", [
    { key: "name", header: "Project", width: 36 },
    { key: "engineer", header: "Engineer", width: 22 },
    { key: "budget", header: "Current FY budget", width: 22, numFmt: NEPALI_CURRENCY },
    { key: "expected", header: "Expected payment till FY end", width: 26, numFmt: NEPALI_CURRENCY },
    { key: "expectedAdv", header: "Expected outstanding advance", width: 26, numFmt: NEPALI_CURRENCY },
    { key: "next", header: "Next FY budget requirement", width: 26, numFmt: NEPALI_CURRENCY },
    { key: "surplus", header: "Surplus / deficit", width: 22, numFmt: NEPALI_CURRENCY },
  ]);

  let totalBudget = 0;
  let totalExpected = 0;
  let totalExpectedAdv = 0;
  let totalNext = 0;
  let totalSurplus = 0;
  let deficitCount = 0;

  for (const p of projects) {
    const budget = asNumber(p.currentFYBudget);
    const expected = asNumber(p.expectedPaymentTillFYEnd);
    const expectedAdv = asNumber(p.expectedOutstandingAdvanceFYEnd);
    const next = asNumber(p.nextFYBudgetRequirement);
    const surplus = budget - expected;
    plan.addRow({
      name: p.projectName,
      engineer: p.engineer?.name ?? "—",
      budget,
      expected,
      expectedAdv,
      next,
      surplus,
    });
    totalBudget += budget;
    totalExpected += expected;
    totalExpectedAdv += expectedAdv;
    totalNext += next;
    totalSurplus += surplus;
    if (surplus < 0) deficitCount++;
  }

  if (projects.length > 0) {
    const lastRow = projects.length + 1;
    applyColorScale(plan, `G2:G${lastRow}`, "surplus");
    // Totals row
    const totals = plan.addRow({
      name: "Totals",
      engineer: "",
      budget: totalBudget,
      expected: totalExpected,
      expectedAdv: totalExpectedAdv,
      next: totalNext,
      surplus: totalSurplus,
    });
    totals.font = { bold: true };
    totals.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
  }

  // ----- Sheet 2: Forecasts -------------------------------------------------
  const forecasts = makeSheet(wb, "Forecasts", [
    { key: "k", header: "Metric", width: 36 },
    { key: "v", header: "Value", width: 24 },
  ]);
  forecasts.addRow({ k: "Current fiscal year", v: currentFY?.label ?? "—" });
  forecasts.addRow({ k: "Non-archived projects", v: projects.length });
  forecasts.addRow({ k: "Projects in deficit", v: deficitCount });
  forecasts.addRow({});
  const t1 = forecasts.addRow({ k: "Total current FY budget", v: totalBudget });
  t1.getCell("v").numFmt = NEPALI_CURRENCY;
  const t2 = forecasts.addRow({ k: "Total expected payment till FY end", v: totalExpected });
  t2.getCell("v").numFmt = NEPALI_CURRENCY;
  const t3 = forecasts.addRow({ k: "Total surplus / deficit", v: totalSurplus });
  t3.getCell("v").numFmt = NEPALI_CURRENCY;
  const t4 = forecasts.addRow({ k: "Total next FY budget requirement", v: totalNext });
  t4.getCell("v").numFmt = NEPALI_CURRENCY;

  return { wb, fyLabel: currentFY?.label ?? "unknown" };
}
