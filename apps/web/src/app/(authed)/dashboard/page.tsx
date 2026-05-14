import Link from "next/link";

import { prisma } from "@pt/db";
import { getProjectScope } from "@pt/shared";

import { requireUser } from "@/lib/auth/guards";

export default async function DashboardPage() {
  const user = await requireUser();
  const isPM = user.role === "PROJECT_MANAGER";
  const scope = getProjectScope(user);

  const [runningCount, completedCount, archivedCount, engineerCount, currentFY] =
    await Promise.all([
      prisma.project.count({
        where: { AND: [scope, { isArchived: false, status: "RUNNING" }] },
      }),
      prisma.project.count({
        where: { AND: [scope, { isArchived: false, status: "COMPLETED" }] },
      }),
      prisma.project.count({
        where: { AND: [scope, { isArchived: true }] },
      }),
      isPM ? prisma.user.count({ where: { role: "ENGINEER", isActive: true } }) : Promise.resolve(0),
      prisma.fiscalYear.findFirst({ where: { isCurrent: true } }),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-white/40">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold">
            {isPM ? "Office overview" : `Welcome, ${user.name}`}
          </h1>
          {currentFY && (
            <p className="mt-1 text-sm text-white/60">
              Current fiscal year:{" "}
              <span className="font-medium text-white/80">{currentFY.label}</span>
            </p>
          )}
        </div>

        <Link
          href="/projects/new"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
        >
          New project
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Running" value={runningCount} />
        <KpiCard label="Completed" value={completedCount} />
        <KpiCard label="Archived" value={archivedCount} />
        {isPM ? <KpiCard label="Engineers" value={engineerCount} /> : <div />}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">
          {isPM ? "Quick links" : "Your work"}
        </h2>
        <ul className="mt-3 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
          <li>
            <Link className="hover:text-white" href="/projects">
              → All projects
            </Link>
          </li>
          <li>
            <Link className="hover:text-white" href="/projects/completed">
              → Completed projects
            </Link>
          </li>
          {isPM && (
            <li>
              <Link className="hover:text-white" href="/projects/archive">
                → Archive
              </Link>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
