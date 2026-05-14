"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@pt/db";
import {
  projectFormSchema,
  type ProjectFormValues,
} from "@pt/shared";

import { writeAuditEvent } from "@/lib/auth/audit";
import { requireRole, requireUser } from "@/lib/auth/guards";

import { findEditableProjectOr404 } from "./scope";

function formDataToObject(form: FormData): Record<string, FormDataEntryValue> {
  const out: Record<string, FormDataEntryValue> = {};
  form.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function pickProjectColumns(values: ProjectFormValues) {
  return {
    projectName: values.projectName,
    infrastructureType: values.infrastructureType,
    projectType: values.projectType,
    originalContractPrice: values.originalContractPrice,
    priceEscalation: values.priceEscalation ?? null,
    contingencies: values.contingencies ?? null,
    contractDate: values.contractDate,
    intendedCompletionDate: values.intendedCompletionDate,
    paymentTillLastFY: values.paymentTillLastFY,
    paymentTillDate: values.paymentTillDate,
    totalAdvancePayment: values.totalAdvancePayment,
    outstandingAdvanceTillLastFY: values.outstandingAdvanceTillLastFY,
    outstandingAdvanceTillDate: values.outstandingAdvanceTillDate,
    currentFYBudget: values.currentFYBudget,
    expectedPaymentTillFYEnd: values.expectedPaymentTillFYEnd ?? null,
    expectedOutstandingAdvanceFYEnd: values.expectedOutstandingAdvanceFYEnd ?? null,
    nextFYBudgetRequirement: values.nextFYBudgetRequirement ?? null,
    physicalProgress: values.physicalProgress,
  };
}

export async function createProject(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = projectFormSchema.parse(formDataToObject(formData));

  // PM may pick the engineer; engineers always own their own creations.
  const engineerId =
    user.role === "PROJECT_MANAGER" && parsed.engineerId
      ? parsed.engineerId
      : user.id;

  // Attach to the current fiscal year.
  const currentFY = await prisma.fiscalYear.findFirst({ where: { isCurrent: true } });

  const data = {
    ...pickProjectColumns(parsed),
    engineerId,
    fiscalYearId: currentFY?.id ?? null,
  };

  const project = await prisma.project.create({ data });

  await writeAuditEvent({
    action: "PROJECT_CREATE",
    actorUserId: user.id,
    targetType: "Project",
    targetId: project.id,
    after: { projectName: project.projectName, engineerId: project.engineerId },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("Missing project id");

  const existing = await findEditableProjectOr404(user, id);
  const parsed = projectFormSchema.parse(formDataToObject(formData));

  const reassignTo =
    user.role === "PROJECT_MANAGER" && parsed.engineerId && parsed.engineerId !== existing.engineerId
      ? parsed.engineerId
      : null;

  const completedAt =
    parsed.status === "COMPLETED" && existing.status !== "COMPLETED"
      ? new Date()
      : parsed.status === "RUNNING" && existing.status === "COMPLETED"
        ? null
        : existing.completedAt;

  const data = {
    ...pickProjectColumns(parsed),
    ...(reassignTo ? { engineerId: reassignTo } : {}),
    ...(parsed.status ? { status: parsed.status } : {}),
    completedAt,
  };

  const updated = await prisma.project.update({ where: { id }, data });

  await writeAuditEvent({
    action: "PROJECT_UPDATE",
    actorUserId: user.id,
    targetType: "Project",
    targetId: id,
    before: { projectName: existing.projectName, status: existing.status },
    after: { projectName: updated.projectName, status: updated.status },
  });

  if (reassignTo) {
    await writeAuditEvent({
      action: "PROJECT_REASSIGN",
      actorUserId: user.id,
      targetType: "Project",
      targetId: id,
      before: { engineerId: existing.engineerId },
      after: { engineerId: reassignTo },
    });
  }

  if (parsed.status === "COMPLETED" && existing.status !== "COMPLETED") {
    await writeAuditEvent({
      action: "PROJECT_COMPLETE",
      actorUserId: user.id,
      targetType: "Project",
      targetId: id,
    });
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  redirect(`/projects/${id}`);
}

export async function completeProjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("Missing project id");

  const existing = await findEditableProjectOr404(user, id);
  if (existing.status === "COMPLETED") {
    redirect(`/projects/${id}`);
  }

  await prisma.project.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  await writeAuditEvent({
    action: "PROJECT_COMPLETE",
    actorUserId: user.id,
    targetType: "Project",
    targetId: id,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects/completed");
  revalidatePath("/dashboard");
  redirect(`/projects/${id}`);
}

export async function archiveProjectAction(formData: FormData): Promise<void> {
  const user = await requireRole("PROJECT_MANAGER");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("Missing project id");

  const existing = await findEditableProjectOr404(user, id);
  if (existing.status !== "COMPLETED") {
    throw new Error("Only completed projects can be archived");
  }

  await prisma.project.update({
    where: { id },
    data: { isArchived: true, archivedAt: new Date(), archivedById: user.id },
  });

  await writeAuditEvent({
    action: "PROJECT_ARCHIVE",
    actorUserId: user.id,
    targetType: "Project",
    targetId: id,
  });

  revalidatePath("/projects/completed");
  revalidatePath("/projects/archive");
  revalidatePath("/dashboard");
  redirect("/projects/archive");
}

export async function restoreProjectAction(formData: FormData): Promise<void> {
  const user = await requireRole("PROJECT_MANAGER");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("Missing project id");

  // Bypass findEditableProjectOr404 since archived items are otherwise hidden.
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing || !existing.isArchived) throw new Error("Project not archived");

  await prisma.project.update({
    where: { id },
    data: { isArchived: false, archivedAt: null, archivedById: null },
  });

  await writeAuditEvent({
    action: "PROJECT_RESTORE",
    actorUserId: user.id,
    targetType: "Project",
    targetId: id,
  });

  revalidatePath("/projects/archive");
  revalidatePath("/projects/completed");
  revalidatePath("/dashboard");
  redirect("/projects/completed");
}
