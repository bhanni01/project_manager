"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { prisma } from "@pt/db";
import { userCreateSchema, userIdSchema, userUpdateSchema } from "@pt/shared";

import { requireRole } from "@/lib/auth/guards";
import { writeAuditEvent } from "@/lib/auth/audit";

import { generateTempPassword } from "./password";

function formDataToObject(form: FormData): Record<string, FormDataEntryValue> {
  const out: Record<string, FormDataEntryValue> = {};
  form.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

async function activePMCount(): Promise<number> {
  return prisma.user.count({ where: { role: "PROJECT_MANAGER", isActive: true } });
}

export async function createUserAction(formData: FormData): Promise<void> {
  const actor = await requireRole("PROJECT_MANAGER");
  const parsed = userCreateSchema.parse(formDataToObject(formData));

  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing) {
    redirect("/users/new?error=email_taken");
  }

  const tempPassword = generateTempPassword(10);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      passwordHash,
    },
  });

  await writeAuditEvent({
    action: "USER_CREATE",
    actorUserId: actor.id,
    targetType: "User",
    targetId: user.id,
    after: { email: user.email, name: user.name, role: user.role },
  });

  revalidatePath("/users");
  redirect(
    `/users?tempPassword=${encodeURIComponent(tempPassword)}&for=${encodeURIComponent(user.email)}`,
  );
}

export async function updateUserAction(formData: FormData): Promise<void> {
  const actor = await requireRole("PROJECT_MANAGER");
  const parsed = userUpdateSchema.parse(formDataToObject(formData));

  const existing = await prisma.user.findUnique({ where: { id: parsed.id } });
  if (!existing) redirect("/users?error=not_found");

  const roleChanged = existing.role !== parsed.role;

  // Self-protection: can't change your own role.
  if (roleChanged && existing.id === actor.id) {
    redirect(`/users/${existing.id}/edit?error=self_role_change`);
  }

  // Last-PM protection: can't demote the only active PM.
  if (
    roleChanged &&
    existing.role === "PROJECT_MANAGER" &&
    parsed.role === "ENGINEER" &&
    existing.isActive
  ) {
    const pmCount = await activePMCount();
    if (pmCount <= 1) {
      redirect(`/users/${existing.id}/edit?error=last_pm`);
    }
  }

  const updated = await prisma.user.update({
    where: { id: parsed.id },
    data: { name: parsed.name, role: parsed.role },
  });

  await writeAuditEvent({
    action: "USER_UPDATE",
    actorUserId: actor.id,
    targetType: "User",
    targetId: updated.id,
    before: { name: existing.name, role: existing.role },
    after: { name: updated.name, role: updated.role },
  });

  if (roleChanged) {
    await writeAuditEvent({
      action: "ROLE_CHANGE",
      actorUserId: actor.id,
      targetType: "User",
      targetId: updated.id,
      before: { role: existing.role },
      after: { role: updated.role },
    });
  }

  revalidatePath("/users");
  revalidatePath(`/users/${updated.id}/edit`);
  redirect(`/users/${updated.id}/edit?saved=1`);
}

export async function resetUserPasswordAction(formData: FormData): Promise<void> {
  const actor = await requireRole("PROJECT_MANAGER");
  const { id } = userIdSchema.parse(formDataToObject(formData));

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) redirect("/users?error=not_found");

  const tempPassword = generateTempPassword(10);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  await writeAuditEvent({
    action: "PASSWORD_RESET",
    actorUserId: actor.id,
    targetType: "User",
    targetId: id,
  });

  redirect(
    `/users/${id}/edit?tempPassword=${encodeURIComponent(tempPassword)}&for=${encodeURIComponent(existing.email)}`,
  );
}

export async function deactivateUserAction(formData: FormData): Promise<void> {
  const actor = await requireRole("PROJECT_MANAGER");
  const { id } = userIdSchema.parse(formDataToObject(formData));

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) redirect("/users?error=not_found");

  if (existing.id === actor.id) {
    redirect(`/users/${id}/edit?error=self_deactivate`);
  }

  if (existing.role === "PROJECT_MANAGER" && existing.isActive) {
    const pmCount = await activePMCount();
    if (pmCount <= 1) {
      redirect(`/users/${id}/edit?error=last_pm`);
    }
  }

  await prisma.user.update({ where: { id }, data: { isActive: false } });

  await writeAuditEvent({
    action: "USER_DEACTIVATE",
    actorUserId: actor.id,
    targetType: "User",
    targetId: id,
  });

  revalidatePath("/users");
  revalidatePath(`/users/${id}/edit`);
  redirect(`/users/${id}/edit?saved=1`);
}

export async function reactivateUserAction(formData: FormData): Promise<void> {
  const actor = await requireRole("PROJECT_MANAGER");
  const { id } = userIdSchema.parse(formDataToObject(formData));

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) redirect("/users?error=not_found");

  await prisma.user.update({ where: { id }, data: { isActive: true } });

  await writeAuditEvent({
    action: "USER_REACTIVATE",
    actorUserId: actor.id,
    targetType: "User",
    targetId: id,
  });

  revalidatePath("/users");
  revalidatePath(`/users/${id}/edit`);
  redirect(`/users/${id}/edit?saved=1`);
}
