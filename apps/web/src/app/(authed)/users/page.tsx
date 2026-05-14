import Link from "next/link";

import { prisma } from "@pt/db";

import { TempPasswordBanner } from "@/components/temp-password-banner";
import { UserListTable, type UserRow } from "@/components/user-list-table";
import { requireRole } from "@/lib/auth/guards";

export default async function UsersPage() {
  const actor = await requireRole("PROJECT_MANAGER");

  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  // Project counts per user.
  const counts = await prisma.project.groupBy({
    by: ["engineerId", "status", "isArchived"],
    _count: { _all: true },
  });
  const byUser = new Map<string, { running: number; completed: number }>();
  for (const c of counts) {
    if (c.isArchived) continue;
    const entry = byUser.get(c.engineerId) ?? { running: 0, completed: 0 };
    if (c.status === "RUNNING") entry.running += c._count._all;
    if (c.status === "COMPLETED") entry.completed += c._count._all;
    byUser.set(c.engineerId, entry);
  }

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
    runningProjects: byUser.get(u.id)?.running ?? 0,
    completedProjects: byUser.get(u.id)?.completed ?? 0,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-white/40">Users</p>
          <h1 className="mt-1 text-3xl font-semibold">Office accounts</h1>
          <p className="mt-1 text-sm text-white/60">
            PM-only. Add new engineers, change roles, reset passwords, and
            deactivate accounts.
          </p>
        </div>
        <Link
          href="/users/new"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
        >
          New user
        </Link>
      </header>

      <TempPasswordBanner />

      <UserListTable rows={rows} currentUserId={actor.id} />
    </div>
  );
}
