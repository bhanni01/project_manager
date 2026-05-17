import ExcelJS from "exceljs";

import type { Prisma, prisma as PrismaClient } from "@pt/db";
import { computeProjectDerived } from "@pt/calc";
import { formatBSDate } from "@pt/shared";

import {
  NEPALI_CURRENCY,
  PERCENT,
  SHORT_DATE,
  applyColorScale,
  asNumber,
  makeSheet,
} from "./workbook";

export interface ProjectListFilters {
  infrastructure?: "ROAD" | "BRIDGE";
  projectType?: "MULTIYEAR" | "SOURCE_APPROVED" | "YEARLY_TENDERED";
  engineerId?: string;
}

export async function buildProjectListWorkbook(
  prisma: typeof PrismaClient,
  scopeWhere: Prisma.ProjectWhereInput,
  filters: ProjectListFilters,
): Promise<ExcelJS.Workbook> {
  const andConditions: Prisma.ProjectWhereInput[] = [
    scopeWhere,
    { isArchived: false },
  ];
  if (filters.infrastructure) andConditions.push({ infrastructureType: filters.infrastructure });
  if (filters.projectType) andConditions.push({ projectType: filters.projectType });
  if (filters.engineerId) andConditions.push({ engineerId: filters.engineerId });

  const projects = await prisma.project.findMany({
    where: { AND: andConditions },
    include: {
      engineer: { select: { name: true } },
      variationOrders: {
        orderBy: { voNumber: "desc" },
        take: 1,
        select: { revisedContractAmount: true },
      },
    },
    orderBy: { projectName: "asc" },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Project Tracker";
  wb.created = new Date();

  // ----- Sheet 1: Projects ---------------------------------------------------
  const sheet = makeSheet(wb, "Projects", [
    { key: "name", header: "Project", width: 36 },
    { key: "engineer", header: "Engineer", width: 22 },
    { key: "infrastructure", header: "Infrastructure", width: 14 },
    { key: "type", header: "Type", width: 18 },
    { key: "status", header: "Status", width: 12 },
    { key: "contractDate", header: "Contract date", width: 14, numFmt: SHORT_DATE },
    { key: "intendedCompletion", header: "Intended completion", width: 18, numFmt: SHORT_DATE },
    { key: "original", header: "Original price", width: 20, numFmt: NEPALI_CURRENCY },
    { key: "current", header: "Current contract", width: 20, numFmt: NEPALI_CURRENCY },
    { key: "revisedCost", header: "Total revised cost", width: 20, numFmt: NEPALI_CURRENCY },
    { key: "physical", header: "Physical %", width: 12, numFmt: PERCENT },
    { key: "financial", header: "Financial %", width: 12, numFmt: PERCENT },
    { key: "budget", header: "Current FY budget", width: 20, numFmt: NEPALI_CURRENCY },
  ]);

  const counts = { ROAD: 0, BRIDGE: 0, RUNNING: 0, COMPLETED: 0 };

  for (const p of projects) {
    counts[p.infrastructureType]++;
    counts[p.status]++;
    const derived = computeProjectDerived(
      {
        originalContractPrice: p.originalContractPrice as unknown as string,
        priceEscalation: p.priceEscalation as unknown as string | null,
        contingencies: p.contingencies as unknown as string | null,
        latestVOAmount: p.variationOrders[0]?.revisedContractAmount as unknown as string | null,
        latestEoTDate: null,
        paymentTillDate: p.paymentTillDate as unknown as string,
        paymentTillLastFY: p.paymentTillLastFY as unknown as string,
        totalAdvancePayment: p.totalAdvancePayment as unknown as string,
        outstandingAdvanceTillLastFY: p.outstandingAdvanceTillLastFY as unknown as string,
        outstandingAdvanceTillDate: p.outstandingAdvanceTillDate as unknown as string,
        currentFYBudget: p.currentFYBudget as unknown as string,
        expectedPaymentTillFYEnd: p.expectedPaymentTillFYEnd as unknown as string | null,
        physicalProgress: p.physicalProgress as unknown as string,
        status: p.status,
        intendedCompletionDate: p.intendedCompletionDate,
      },
      new Date(),
    );
    sheet.addRow({
      name: p.projectName,
      engineer: p.engineer?.name ?? "—",
      infrastructure: p.infrastructureType === "ROAD" ? "Road" : "Bridge",
      type: typeLabel(p.projectType),
      status: p.status === "RUNNING" ? "Running" : "Completed",
      contractDate: p.contractDate,
      intendedCompletion: p.intendedCompletionDate,
      original: asNumber(p.originalContractPrice),
      current: Number(derived.currentContractAmount.toString()),
      revisedCost: Number(derived.totalRevisedCost.toString()),
      physical: asNumber(p.physicalProgress),
      financial: Number(derived.overallFinancialProgressPct.toString()),
      budget: asNumber(p.currentFYBudget),
    });
  }

  if (projects.length > 0) {
    const lastRow = projects.length + 1;
    applyColorScale(sheet, `J2:J${lastRow}`, "spend"); // revised cost
    applyColorScale(sheet, `L2:L${lastRow}`, "spend"); // financial %
  }

  // ----- Sheet 2: Counts -----------------------------------------------------
  const counts2 = makeSheet(wb, "Counts", [
    { key: "label", header: "Group", width: 30 },
    { key: "value", header: "Count", width: 12 },
  ]);
  counts2.addRow({ label: "Road projects", value: counts.ROAD });
  counts2.addRow({ label: "Bridge projects", value: counts.BRIDGE });
  counts2.addRow({});
  counts2.addRow({ label: "Running", value: counts.RUNNING });
  counts2.addRow({ label: "Completed (not archived)", value: counts.COMPLETED });
  counts2.addRow({});
  counts2.addRow({ label: "Total non-archived", value: projects.length });
  counts2.addRow({ label: "Generated for filters", value: describeFilters(filters) });

  // BS contract date as a comment alongside AD for the eye-candy. Skip for v1 —
  // the AD column is sortable; BS is in the single-project export.

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

function describeFilters(f: ProjectListFilters): string {
  const parts: string[] = [];
  if (f.infrastructure) parts.push(`infrastructure=${f.infrastructure}`);
  if (f.projectType) parts.push(`type=${f.projectType}`);
  if (f.engineerId) parts.push(`engineerId=${f.engineerId.slice(0, 8)}…`);
  return parts.length === 0 ? "(none)" : parts.join(", ");
}

export { formatBSDate };
