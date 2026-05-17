"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@pt/db";
import { rolloverInputSchema } from "@pt/shared";

import { writeAuditEvent } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/guards";

import { buildRolloverPreview, loadPreviewProjects } from "./preview";

function formDataToObject(form: FormData): Record<string, FormDataEntryValue> {
  const out: Record<string, FormDataEntryValue> = {};
  form.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function buildPreviewUrl(input: { nextLabel: string; startDate: Date; endDate: Date }): string {
  const params = new URLSearchParams({
    label: input.nextLabel,
    startDate: input.startDate.toISOString().slice(0, 10),
    endDate: input.endDate.toISOString().slice(0, 10),
  });
  return `/fiscal-year/preview?${params.toString()}`;
}

async function ensureCurrentFY() {
  const fy = await prisma.fiscalYear.findFirst({ where: { isCurrent: true } });
  if (!fy) redirect("/fiscal-year/new?error=no_current_fy");
  return fy;
}

async function ensureLabelAvailable(nextLabel: string): Promise<boolean> {
  const existing = await prisma.fiscalYear.findUnique({ where: { label: nextLabel } });
  return !existing;
}

/**
 * Validate the form input and bounce to the dry-run preview page. Does not
 * write anything.
 */
export async function previewRolloverAction(formData: FormData): Promise<void> {
  await requireRole("PROJECT_MANAGER");

  const parsed = rolloverInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const isEndDate = parsed.error.issues.some((i) => i.path[0] === "endDate");
    redirect(`/fiscal-year/new?error=${isEndDate ? "dates_invalid" : "label_format"}`);
  }

  await ensureCurrentFY();

  const available = await ensureLabelAvailable(parsed.data.nextLabel);
  if (!available) redirect("/fiscal-year/new?error=label_taken");

  redirect(buildPreviewUrl(parsed.data));
}

/**
 * Commit the rollover atomically. Runs the entire workflow inside a single
 * Prisma transaction with Serializable isolation. Idempotent re-runs are safe
 * because of @@unique([projectId, fiscalYearId]) + skipDuplicates on the
 * snapshot inserts, and the one_current_fy partial unique index that prevents
 * two `isCurrent = true` rows.
 */
export async function rolloverFiscalYearAction(formData: FormData): Promise<void> {
  const actor = await requireRole("PROJECT_MANAGER");

  const parsed = rolloverInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) redirect("/fiscal-year/new?error=dates_invalid");

  const currentFY = await ensureCurrentFY();
  const available = await ensureLabelAvailable(parsed.data.nextLabel);
  if (!available) redirect("/fiscal-year/new?error=label_taken");

  const projects = await loadPreviewProjects(prisma);
  const { rows } = buildRolloverPreview(projects);

  const result = await prisma.$transaction(
    async (tx) => {
      // 1. Close the current FY first (the partial unique index disallows two
      //    isCurrent=true rows).
      await tx.fiscalYear.update({
        where: { id: currentFY.id },
        data: { isCurrent: false, closedAt: new Date(), closedById: actor.id },
      });

      // 2. Open the new FY.
      const nextFY = await tx.fiscalYear.create({
        data: {
          label: parsed.data.nextLabel,
          startDate: parsed.data.startDate,
          endDate: parsed.data.endDate,
          isCurrent: true,
        },
      });

      // 3. Snapshot every non-archived project. skipDuplicates handles
      //    crash-recovery idempotency.
      const snapshotData = rows.map((r) => ({
        projectId: r.projectId,
        fiscalYearId: currentFY.id,
        openingPayment: r.openingPayment.toString(),
        closingPayment: r.closingPayment.toString(),
        fyPayment: r.fyPayment.toString(),
        fyBudget: r.fyBudget.toString(),
        fyAdvanceRecovered: r.fyAdvanceRecovered.toString(),
        physicalProgress: r.physicalProgress.toString(),
        financialProgress: r.financialProgress.toString(),
        surplusDeficit: r.surplusDeficit.toString(),
      }));
      const created = await tx.fiscalYearSnapshot.createMany({
        data: snapshotData,
        skipDuplicates: true,
      });

      // 4. Roll each project's balances forward and clear forecasts.
      for (const project of projects) {
        await tx.project.update({
          where: { id: project.id },
          data: {
            paymentTillLastFY: project.paymentTillDate,
            outstandingAdvanceTillLastFY: project.outstandingAdvanceTillDate,
            currentFYBudget: project.nextFYBudgetRequirement ?? "0",
            expectedPaymentTillFYEnd: null,
            expectedOutstandingAdvanceFYEnd: null,
            nextFYBudgetRequirement: null,
            fiscalYearId: nextFY.id,
          },
        });
      }

      return {
        closedFY: { id: currentFY.id, label: currentFY.label },
        openedFY: { id: nextFY.id, label: nextFY.label },
        snapshotsCreated: created.count,
      };
    },
    {
      isolationLevel: "Serializable",
      timeout: 60_000,
      maxWait: 10_000,
    },
  );

  await writeAuditEvent({
    action: "FY_ROLLOVER",
    actorUserId: actor.id,
    targetType: "FiscalYear",
    targetId: result.openedFY.id,
    after: result,
  });

  revalidatePath("/fiscal-year");
  revalidatePath("/budget-planning");
  revalidatePath("/dashboard");
  revalidatePath("/projects");

  redirect(`/fiscal-year?rolled=${encodeURIComponent(result.openedFY.label)}`);
}
