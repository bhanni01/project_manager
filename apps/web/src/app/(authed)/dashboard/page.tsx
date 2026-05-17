import Link from "next/link";

import { prisma } from "@pt/db";
import { getProjectScope } from "@pt/shared";

import { Sparkline } from "@/components/sparkline";
import { requireUser } from "@/lib/auth/guards";

export default async function DashboardPage() {
  const user = await requireUser();
  const isPM = user.role === "PROJECT_MANAGER";
  const scope = getProjectScope(user);

  const [runningCount, completedCount, archivedCount, engineerCount, currentFY, snapshotHistory] =
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
      isPM
        ? prisma.user.count({ where: { role: "ENGINEER", isActive: true } })
        : Promise.resolve(0),
      prisma.fiscalYear.findFirst({ where: { isCurrent: true } }),
      // Per-FY snapshot rollup, scoped to the user. Used for KPI sparklines.
      prisma.fiscalYearSnapshot.findMany({
        where: {
          project: { AND: [scope, {}] },
        },
        include: {
          project: { select: { status: true, isArchived: true } },
          fiscalYear: { select: { label: true, startDate: true } },
        },
        orderBy: { fiscalYear: { startDate: "asc" } },
      }),
    ]);

  // Build per-FY counts for sparklines (Running / Completed / Archived).
  const fyMap = new Map<
    string,
    { running: number; completed: number; archived: number }
  >();
  for (const s of snapshotHistory) {
    const key = s.fiscalYear.label;
    const entry = fyMap.get(key) ?? { running: 0, completed: 0, archived: 0 };
    if (s.project.isArchived) entry.archived++;
    else if (s.project.status === "RUNNING") entry.running++;
    else entry.completed++;
    fyMap.set(key, entry);
  }
  // Add a final "today" point so the spark moves to the current count.
  const labels = Array.from(fyMap.keys());
  const runningPts = labels.map((l) => fyMap.get(l)!.running).concat(runningCount);
  const completedPts = labels.map((l) => fyMap.get(l)!.completed).concat(completedCount);
  const archivedPts = labels.map((l) => fyMap.get(l)!.archived).concat(archivedCount);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-fg-muted">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold">
            {isPM ? "Office overview" : `Welcome, ${user.name}`}
          </h1>
          {currentFY && (
            <p className="mt-1 text-sm text-fg-muted">
              Current fiscal year:{" "}
              <span className="font-medium text-fg">{currentFY.label}</span>
            </p>
          )}
        </div>

        <Link
          href="/projects/new"
          className="accent-gradient glow rounded-md px-4 py-2 text-sm font-medium text-white transition"
        >
          New project
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Running" value={runningCount} points={runningPts} />
        <KpiCard label="Completed" value={completedCount} points={completedPts} />
        <KpiCard label="Archived" value={archivedCount} points={archivedPts} />
        {isPM ? <KpiCard label="Engineers" value={engineerCount} /> : <div />}
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold">
          {isPM ? "Quick links" : "Your work"}
        </h2>
        <ul className="mt-3 grid gap-2 text-sm text-fg-muted sm:grid-cols-2">
          <li>
            <Link className="hover:text-fg" href="/projects">
              → All projects
            </Link>
          </li>
          <li>
            <Link className="hover:text-fg" href="/projects/completed">
              → Completed projects
            </Link>
          </li>
          {isPM && (
            <>
              <li>
                <Link className="hover:text-fg" href="/projects/archive">
                  → Archive
                </Link>
              </li>
              <li>
                <Link className="hover:text-fg" href="/reports">
                  → Reports
                </Link>
              </li>
            </>
          )}
        </ul>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  points,
}: {
  label: string;
  value: number;
  points?: number[];
}) {
  return (
    <div className="glass glow rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wider text-fg-muted">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
        {points && <Sparkline points={points} className="opacity-90" />}
      </div>
    </div>
  );
}
