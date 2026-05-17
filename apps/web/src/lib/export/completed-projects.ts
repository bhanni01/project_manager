import ExcelJS from "exceljs";

import type { Prisma, prisma as PrismaClient } from "@pt/db";

import {
  NEPALI_CURRENCY,
  PERCENT,
  SHORT_DATE,
  applyColorScale,
  asNumber,
  makeSheet,
} from "./workbook";

export async function buildCompletedProjectsWorkbook(
  prisma: typeof PrismaClient,
  scopeWhere: Prisma.ProjectWhereInput,
): Promise<ExcelJS.Workbook> {
  const completed = await prisma.project.findMany({
    where: { AND: [scopeWhere, { isArchived: false, status: "COMPLETED" }] },
    include: {
      engineer: { select: { id: true, name: true } },
      variationOrders: { orderBy: { voNumber: "desc" }, take: 1 },
    },
    orderBy: { completedAt: "desc" },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Project Tracker";
  wb.created = new Date();

  // ----- Sheet 1: Completed list --------------------------------------------
  const list = makeSheet(wb, "Completed", [
    { key: "name", header: "Project", width: 36 },
    { key: "engineer", header: "Engineer", width: 22 },
    { key: "infrastructure", header: "Infrastructure", width: 14 },
    { key: "type", header: "Type", width: 18 },
    { key: "completedAt", header: "Completed on", width: 14, numFmt: SHORT_DATE },
    { key: "original", header: "Original price", width: 20, numFmt: NEPALI_CURRENCY },
    { key: "current", header: "Final contract", width: 20, numFmt: NEPALI_CURRENCY },
    { key: "variance", header: "Variance", width: 20, numFmt: NEPALI_CURRENCY },
    { key: "variancePct", header: "Variance %", width: 14, numFmt: PERCENT },
  ]);

  interface VarianceRow {
    name: string;
    engineerId: string;
    engineerName: string;
    year: number;
    original: number;
    current: number;
    variance: number;
  }
  const rows: VarianceRow[] = [];

  for (const p of completed) {
    const original = asNumber(p.originalContractPrice);
    const latestVO = p.variationOrders[0]?.revisedContractAmount;
    const current = latestVO !== undefined ? asNumber(latestVO) : original;
    const variance = current - original;
    const variancePct = original === 0 ? 0 : (variance / original) * 100;
    list.addRow({
      name: p.projectName,
      engineer: p.engineer?.name ?? "—",
      infrastructure: p.infrastructureType === "ROAD" ? "Road" : "Bridge",
      type: typeLabel(p.projectType),
      completedAt: p.completedAt ?? null,
      original,
      current,
      variance,
      variancePct,
    });
    rows.push({
      name: p.projectName,
      engineerId: p.engineer?.id ?? "—",
      engineerName: p.engineer?.name ?? "—",
      year: p.completedAt ? p.completedAt.getFullYear() : 0,
      original,
      current,
      variance,
    });
  }
  if (completed.length > 0) {
    applyColorScale(list, `H2:H${completed.length + 1}`, "surplus"); // variance
  }

  // ----- Sheet 2: By Engineer -----------------------------------------------
  const byEng = makeSheet(wb, "By Engineer", [
    { key: "engineer", header: "Engineer", width: 30 },
    { key: "count", header: "Completed projects", width: 18 },
    { key: "original", header: "Total original", width: 22, numFmt: NEPALI_CURRENCY },
    { key: "current", header: "Total final", width: 22, numFmt: NEPALI_CURRENCY },
    { key: "variance", header: "Total variance", width: 22, numFmt: NEPALI_CURRENCY },
  ]);
  const engineerMap = new Map<
    string,
    { name: string; count: number; original: number; current: number; variance: number }
  >();
  for (const r of rows) {
    const entry = engineerMap.get(r.engineerId) ?? {
      name: r.engineerName,
      count: 0,
      original: 0,
      current: 0,
      variance: 0,
    };
    entry.count++;
    entry.original += r.original;
    entry.current += r.current;
    entry.variance += r.variance;
    engineerMap.set(r.engineerId, entry);
  }
  for (const e of engineerMap.values()) {
    byEng.addRow({
      engineer: e.name,
      count: e.count,
      original: e.original,
      current: e.current,
      variance: e.variance,
    });
  }

  // ----- Sheet 3: By Year ---------------------------------------------------
  const byYear = makeSheet(wb, "By Year", [
    { key: "year", header: "Year (AD)", width: 14 },
    { key: "count", header: "Completed projects", width: 18 },
    { key: "current", header: "Total final", width: 22, numFmt: NEPALI_CURRENCY },
  ]);
  const yearMap = new Map<number, { count: number; current: number }>();
  for (const r of rows) {
    const entry = yearMap.get(r.year) ?? { count: 0, current: 0 };
    entry.count++;
    entry.current += r.current;
    yearMap.set(r.year, entry);
  }
  for (const [year, entry] of Array.from(yearMap.entries()).sort((a, b) => a[0] - b[0])) {
    byYear.addRow({ year, count: entry.count, current: entry.current });
  }

  // ----- Sheet 4: Cost Variance ---------------------------------------------
  const variance = makeSheet(wb, "Cost Variance", [
    { key: "name", header: "Project", width: 36 },
    { key: "engineer", header: "Engineer", width: 22 },
    { key: "original", header: "Original", width: 20, numFmt: NEPALI_CURRENCY },
    { key: "current", header: "Final", width: 20, numFmt: NEPALI_CURRENCY },
    { key: "variance", header: "Variance", width: 20, numFmt: NEPALI_CURRENCY },
  ]);
  const sorted = [...rows].sort((a, b) => b.variance - a.variance);
  for (const r of sorted) {
    variance.addRow({
      name: r.name,
      engineer: r.engineerName,
      original: r.original,
      current: r.current,
      variance: r.variance,
    });
  }
  if (sorted.length > 0) {
    applyColorScale(variance, `E2:E${sorted.length + 1}`, "surplus");
  }

  return wb;
}

function typeLabel(t: "MULTIYEAR" | "SOURCE_APPROVED" | "YEARLY_TENDERED"): string {
  switch (t) {
    case "MULTIYEAR":
      return "Multiyear";
    case "SOURCE_APPROVED":
      return "Source Approved";
    case "YEARLY_TENDERED":
      return "Yearly Tendered";
  }
}
