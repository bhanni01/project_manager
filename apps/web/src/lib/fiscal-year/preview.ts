import Decimal from "decimal.js";

import type { FiscalYear, Project, User, VariationOrder } from "@pt/db";
import { overallFinancialProgressPct, toDecimal } from "@pt/calc";

export type PreviewProject = Project & {
  engineer: Pick<User, "id" | "name"> | null;
  variationOrders: Pick<VariationOrder, "revisedContractAmount">[];
};

export interface RolloverPreviewRow {
  projectId: string;
  projectName: string;
  engineerName: string;
  openingPayment: Decimal;
  closingPayment: Decimal;
  fyPayment: Decimal;
  fyBudget: Decimal;
  fyAdvanceRecovered: Decimal;
  physicalProgress: Decimal;
  financialProgress: Decimal;
  surplusDeficit: Decimal;
  newCurrentFYBudget: Decimal;
}

export interface RolloverPreviewTotals {
  projects: number;
  fyPayment: Decimal;
  fyBudget: Decimal;
  fyAdvanceRecovered: Decimal;
  surplusDeficit: Decimal;
  newCurrentFYBudget: Decimal;
}

export interface RolloverPreview {
  rows: RolloverPreviewRow[];
  totals: RolloverPreviewTotals;
}

/**
 * Pure helper used by both the dry-run preview page and the commit action.
 * Computes what each non-archived project's snapshot will contain and what
 * its post-rollover balances will look like, without writing anything.
 */
export function buildRolloverPreview(projects: PreviewProject[]): RolloverPreview {
  const rows: RolloverPreviewRow[] = projects.map((p) => {
    const opening = toDecimal(p.paymentTillLastFY as unknown as string);
    const closing = toDecimal(p.paymentTillDate as unknown as string);
    const fyPayment = closing.minus(opening);

    const fyBudget = toDecimal(p.currentFYBudget as unknown as string);
    const advanceLast = toDecimal(p.outstandingAdvanceTillLastFY as unknown as string);
    const advanceCurrent = toDecimal(p.outstandingAdvanceTillDate as unknown as string);
    const fyAdvanceRecovered = advanceLast.minus(advanceCurrent);

    const physical = toDecimal(p.physicalProgress as unknown as string);

    const latestVO = p.variationOrders[0]?.revisedContractAmount;
    const cca = latestVO
      ? toDecimal(latestVO as unknown as string)
      : toDecimal(p.originalContractPrice as unknown as string);
    const trc = cca
      .plus(toDecimal((p.priceEscalation as unknown as string) ?? null))
      .plus(toDecimal((p.contingencies as unknown as string) ?? null));
    const emo = closing.plus(advanceCurrent);
    const financial = overallFinancialProgressPct({
      effectiveMoneyOut: emo,
      totalRevisedCost: trc,
    });

    const expectedPayment = toDecimal(
      (p.expectedPaymentTillFYEnd as unknown as string) ?? null,
    );
    const surplus = fyBudget.minus(expectedPayment);

    const next = toDecimal((p.nextFYBudgetRequirement as unknown as string) ?? null);

    return {
      projectId: p.id,
      projectName: p.projectName,
      engineerName: p.engineer?.name ?? "—",
      openingPayment: opening,
      closingPayment: closing,
      fyPayment,
      fyBudget,
      fyAdvanceRecovered,
      physicalProgress: physical,
      financialProgress: financial,
      surplusDeficit: surplus,
      newCurrentFYBudget: next,
    };
  });

  const totals = rows.reduce<RolloverPreviewTotals>(
    (acc, r) => ({
      projects: acc.projects + 1,
      fyPayment: acc.fyPayment.plus(r.fyPayment),
      fyBudget: acc.fyBudget.plus(r.fyBudget),
      fyAdvanceRecovered: acc.fyAdvanceRecovered.plus(r.fyAdvanceRecovered),
      surplusDeficit: acc.surplusDeficit.plus(r.surplusDeficit),
      newCurrentFYBudget: acc.newCurrentFYBudget.plus(r.newCurrentFYBudget),
    }),
    {
      projects: 0,
      fyPayment: new Decimal(0),
      fyBudget: new Decimal(0),
      fyAdvanceRecovered: new Decimal(0),
      surplusDeficit: new Decimal(0),
      newCurrentFYBudget: new Decimal(0),
    },
  );

  return { rows, totals };
}

import type { prisma } from "@pt/db";

export async function loadPreviewProjects(
  client: typeof prisma,
): Promise<PreviewProject[]> {
  return client.project.findMany({
    where: { isArchived: false },
    include: {
      engineer: { select: { id: true, name: true } },
      variationOrders: {
        orderBy: { voNumber: "desc" },
        take: 1,
        select: { revisedContractAmount: true },
      },
    },
    orderBy: { projectName: "asc" },
  });
}

/** Currently-fixed FY of reference for the preview UI. */
export interface FYPair {
  closing: FiscalYear;
  next: { label: string; startDate: Date; endDate: Date };
}
