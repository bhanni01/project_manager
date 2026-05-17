import ExcelJS from "exceljs";

import { computeProjectDerived } from "@pt/calc";
import type { prisma as PrismaClient } from "@pt/db";
import { formatBSDate, formatFYLabel } from "@pt/shared";

import {
  NEPALI_CURRENCY,
  NEPALI_CURRENCY_2DP,
  PERCENT,
  SHORT_DATE,
  applyColorScale,
  asNumber,
  makeSheet,
} from "./workbook";

export async function buildSingleProjectWorkbook(
  prisma: typeof PrismaClient,
  projectId: string,
): Promise<{ wb: ExcelJS.Workbook; projectName: string }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      engineer: { select: { name: true, email: true } },
      variationOrders: { orderBy: { voNumber: "asc" } },
      extensionsOfTime: { orderBy: { eotNumber: "asc" } },
      snapshots: {
        include: { fiscalYear: { select: { label: true, startDate: true } } },
        orderBy: { fiscalYear: { startDate: "asc" } },
      },
    },
  });
  if (!project) throw new Error(`Project ${projectId} not found`);

  const latestVO = project.variationOrders.at(-1);
  const latestEoT = project.extensionsOfTime.at(-1);

  const derived = computeProjectDerived(
    {
      originalContractPrice: project.originalContractPrice as unknown as string,
      priceEscalation: project.priceEscalation as unknown as string | null,
      contingencies: project.contingencies as unknown as string | null,
      latestVOAmount: latestVO
        ? (latestVO.revisedContractAmount as unknown as string)
        : null,
      latestEoTDate: latestEoT?.extendedToDate ?? null,
      paymentTillDate: project.paymentTillDate as unknown as string,
      paymentTillLastFY: project.paymentTillLastFY as unknown as string,
      totalAdvancePayment: project.totalAdvancePayment as unknown as string,
      outstandingAdvanceTillLastFY:
        project.outstandingAdvanceTillLastFY as unknown as string,
      outstandingAdvanceTillDate:
        project.outstandingAdvanceTillDate as unknown as string,
      currentFYBudget: project.currentFYBudget as unknown as string,
      expectedPaymentTillFYEnd:
        project.expectedPaymentTillFYEnd as unknown as string | null,
      physicalProgress: project.physicalProgress as unknown as string,
      status: project.status,
      intendedCompletionDate: project.intendedCompletionDate,
    },
    new Date(),
  );

  const wb = new ExcelJS.Workbook();
  wb.creator = "Project Tracker";
  wb.created = new Date();

  // ----- Sheet 1: Summary ----------------------------------------------------
  const summary = wb.addWorksheet("Summary");
  summary.columns = [
    { key: "k", header: "Field", width: 38 },
    { key: "v", header: "Value", width: 30 },
  ];
  {
    const r1 = summary.getRow(1);
    r1.font = { bold: true, color: { argb: "FFFFFFFF" } };
    r1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
    summary.views = [{ state: "frozen", ySplit: 1 }];
  }

  const summaryRows: Array<[string, string | number, string?]> = [
    ["Project name", project.projectName],
    ["Infrastructure", project.infrastructureType === "ROAD" ? "Road" : "Bridge"],
    ["Project type", typeLabel(project.projectType)],
    ["Status", project.isArchived ? "Archived" : project.status === "RUNNING" ? "Running" : "Completed"],
    ["Engineer", project.engineer?.name ?? "—"],
    ["Engineer email", project.engineer?.email ?? ""],
    ["Contract date (BS)", formatBSDate(project.contractDate, "long")],
    ["Contract date (AD)", project.contractDate.toISOString().slice(0, 10)],
    ["Intended completion (BS)", formatBSDate(project.intendedCompletionDate, "long")],
    ["Revised completion (BS)", formatBSDate(derived.revisedCompletionDate, "long")],
    ["Total EoT days", derived.totalEoTDays],
    ["", ""],
    ["Original contract price", asNumber(project.originalContractPrice), NEPALI_CURRENCY],
    ["Price escalation", asNumber(project.priceEscalation), NEPALI_CURRENCY],
    ["Contingencies", asNumber(project.contingencies), NEPALI_CURRENCY],
    ["Current contract amount", Number(derived.currentContractAmount.toString()), NEPALI_CURRENCY],
    ["Total revised cost", Number(derived.totalRevisedCost.toString()), NEPALI_CURRENCY],
    ["", ""],
    ["Payment till last FY", asNumber(project.paymentTillLastFY), NEPALI_CURRENCY],
    ["Payment till date", asNumber(project.paymentTillDate), NEPALI_CURRENCY],
    ["Current FY payment so far", Number(derived.currentFYPaymentSoFar.toString()), NEPALI_CURRENCY],
    ["Effective money out", Number(derived.effectiveMoneyOut.toString()), NEPALI_CURRENCY],
    ["Overall financial progress", Number(derived.overallFinancialProgressPct.toString()), PERCENT],
    ["Physical progress", asNumber(project.physicalProgress), PERCENT],
    ["", ""],
    ["Total advance payment", asNumber(project.totalAdvancePayment), NEPALI_CURRENCY],
    ["Outstanding advance (last FY)", asNumber(project.outstandingAdvanceTillLastFY), NEPALI_CURRENCY],
    ["Outstanding advance (to date)", asNumber(project.outstandingAdvanceTillDate), NEPALI_CURRENCY],
    ["Current FY advance recovered", Number(derived.currentFYAdvanceRecovered.toString()), NEPALI_CURRENCY],
    ["", ""],
    ["Current FY budget", asNumber(project.currentFYBudget), NEPALI_CURRENCY],
    ["Expected payment till FY end", asNumber(project.expectedPaymentTillFYEnd), NEPALI_CURRENCY],
    ["Expected outstanding advance (FY end)", asNumber(project.expectedOutstandingAdvanceFYEnd), NEPALI_CURRENCY],
    ["Next FY budget requirement", asNumber(project.nextFYBudgetRequirement), NEPALI_CURRENCY],
    ["Current FY budget expenditure", Number(derived.currentFYBudgetExpenditureProgressPct.toString()), PERCENT],
    ["Current FY surplus / deficit", Number(derived.currentFYSurplusDeficit.toString()), NEPALI_CURRENCY],
  ];

  for (const [k, v, fmt] of summaryRows) {
    const row = summary.addRow({ k, v });
    if (fmt) row.getCell("v").numFmt = fmt;
  }

  // ----- Sheet 2: Variation Orders ------------------------------------------
  const vos = makeSheet(wb, "Variation Orders", [
    { key: "voNumber", header: "VO #", width: 10 },
    { key: "approvalBS", header: "Approval (BS)", width: 20 },
    { key: "approvalAD", header: "Approval (AD)", width: 14, numFmt: SHORT_DATE },
    { key: "amount", header: "Revised contract amount", width: 24, numFmt: NEPALI_CURRENCY },
    { key: "description", header: "Description", width: 50 },
  ]);
  for (const vo of project.variationOrders) {
    vos.addRow({
      voNumber: vo.voNumber,
      approvalBS: formatBSDate(vo.approvalDate, "long"),
      approvalAD: vo.approvalDate,
      amount: asNumber(vo.revisedContractAmount),
      description: vo.description,
    });
  }
  if (project.variationOrders.length > 0) {
    applyColorScale(vos, `D2:D${project.variationOrders.length + 1}`, "spend");
  }

  // ----- Sheet 3: EoTs -------------------------------------------------------
  const eots = makeSheet(wb, "EoTs", [
    { key: "eotNumber", header: "EoT #", width: 10 },
    { key: "extendedBS", header: "Extended to (BS)", width: 22 },
    { key: "extendedAD", header: "Extended to (AD)", width: 14, numFmt: SHORT_DATE },
    { key: "approvalBS", header: "Approval (BS)", width: 20 },
    { key: "daysAdded", header: "Days added", width: 14 },
    { key: "reason", header: "Reason", width: 50 },
  ]);
  let prevDate: Date = project.intendedCompletionDate;
  for (const eot of project.extensionsOfTime) {
    const days = Math.round(
      (eot.extendedToDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    eots.addRow({
      eotNumber: eot.eotNumber,
      extendedBS: formatBSDate(eot.extendedToDate, "long"),
      extendedAD: eot.extendedToDate,
      approvalBS: formatBSDate(eot.approvalDate, "long"),
      daysAdded: days,
      reason: eot.reason,
    });
    prevDate = eot.extendedToDate;
  }
  if (project.extensionsOfTime.length > 0) {
    applyColorScale(eots, `E2:E${project.extensionsOfTime.length + 1}`, "surplus");
  }

  // ----- Sheet 4: FY History -------------------------------------------------
  const history = makeSheet(wb, "FY History", [
    { key: "fy", header: "Fiscal year", width: 14 },
    { key: "opening", header: "Opening payment", width: 22, numFmt: NEPALI_CURRENCY },
    { key: "closing", header: "Closing payment", width: 22, numFmt: NEPALI_CURRENCY },
    { key: "fyPayment", header: "FY payment", width: 22, numFmt: NEPALI_CURRENCY },
    { key: "fyBudget", header: "FY budget", width: 22, numFmt: NEPALI_CURRENCY },
    { key: "advanceRecovered", header: "Advance recovered", width: 22, numFmt: NEPALI_CURRENCY },
    { key: "physical", header: "Physical %", width: 14, numFmt: PERCENT },
    { key: "financial", header: "Financial %", width: 14, numFmt: PERCENT },
    { key: "surplus", header: "Surplus / deficit", width: 22, numFmt: NEPALI_CURRENCY },
  ]);
  for (const s of project.snapshots) {
    history.addRow({
      fy: s.fiscalYear.label,
      opening: asNumber(s.openingPayment),
      closing: asNumber(s.closingPayment),
      fyPayment: asNumber(s.fyPayment),
      fyBudget: asNumber(s.fyBudget),
      advanceRecovered: asNumber(s.fyAdvanceRecovered),
      physical: asNumber(s.physicalProgress),
      financial: asNumber(s.financialProgress),
      surplus: asNumber(s.surplusDeficit),
    });
  }
  if (project.snapshots.length > 0) {
    applyColorScale(history, `I2:I${project.snapshots.length + 1}`, "surplus");
  }

  // ----- Sheet 5: Advance Ledger --------------------------------------------
  const ledger = makeSheet(wb, "Advance Ledger", [
    { key: "k", header: "Field", width: 40 },
    { key: "v", header: "Value", width: 24, numFmt: NEPALI_CURRENCY_2DP },
  ]);
  const totalAdvance = asNumber(project.totalAdvancePayment);
  const openingOutstanding = asNumber(project.outstandingAdvanceTillLastFY);
  const closingOutstanding = asNumber(project.outstandingAdvanceTillDate);
  const recoveredThisFY = openingOutstanding - closingOutstanding;
  const ledgerRows: Array<[string, number]> = [
    ["Total advance disbursed (cumulative)", totalAdvance],
    ["Outstanding advance (opening — last FY)", openingOutstanding],
    ["Recovered this FY", recoveredThisFY],
    ["Outstanding advance (current — till date)", closingOutstanding],
  ];
  for (const [k, v] of ledgerRows) ledger.addRow({ k, v });
  applyColorScale(ledger, "B2:B5", "spend");

  return { wb, projectName: project.projectName };
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

export { formatFYLabel };
