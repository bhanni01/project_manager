import Link from "next/link";

import { prisma } from "@pt/db";
import { formatBSDate } from "@pt/shared";

import { FlashToast } from "@/components/flash-toast";
import { requireRole } from "@/lib/auth/guards";

export default async function FiscalYearPage() {
  await requireRole("PROJECT_MANAGER");

  const fiscalYears = await prisma.fiscalYear.findMany({
    orderBy: { startDate: "desc" },
  });

  // Snapshot count + closed-by info per FY (parallel).
  const fyIds = fiscalYears.map((fy) => fy.id);
  const closedByIds = Array.from(
    new Set(fiscalYears.map((fy) => fy.closedById).filter((v): v is string => Boolean(v))),
  );

  const [snapshotCounts, closedBy] = await Promise.all([
    prisma.fiscalYearSnapshot.groupBy({
      by: ["fiscalYearId"],
      where: { fiscalYearId: { in: fyIds } },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { id: { in: closedByIds } },
      select: { id: true, name: true },
    }),
  ]);

  const snapshotsByFY = new Map(snapshotCounts.map((c) => [c.fiscalYearId, c._count._all]));
  const closedByMap = new Map(closedBy.map((u) => [u.id, u.name]));

  const hasCurrent = fiscalYears.some((fy) => fy.isCurrent);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-white/40">Fiscal year</p>
          <h1 className="mt-1 text-3xl font-semibold">Fiscal years</h1>
          <p className="mt-1 text-sm text-white/60">
            PM-only. Close the current FY and open the next.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href="/fiscal-year/new"
            aria-disabled={!hasCurrent}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              hasCurrent
                ? "bg-white text-black hover:bg-white/90"
                : "cursor-not-allowed bg-white/20 text-white/40"
            }`}
          >
            Close &amp; open next FY
          </Link>
          {!hasCurrent && (
            <span className="text-xs text-white/40">
              No active fiscal year — seed or recreate one first.
            </span>
          )}
        </div>
      </header>

      <FlashToast />

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="sticky-thead bg-white/[0.04] text-left text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Start (BS)</th>
              <th className="px-4 py-3">End (BS)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Closed by</th>
              <th className="px-4 py-3 text-right">Snapshots</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {fiscalYears.map((fy) => (
              <tr key={fy.id} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium text-white">{fy.label}</td>
                <td className="px-4 py-3 text-white/70">
                  {formatBSDate(fy.startDate, "long")}
                </td>
                <td className="px-4 py-3 text-white/70">{formatBSDate(fy.endDate, "long")}</td>
                <td className="px-4 py-3">
                  {fy.isCurrent ? (
                    <span className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200">
                      Current
                    </span>
                  ) : (
                    <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-xs text-white/60">
                      Closed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/70">
                  {fy.closedById ? closedByMap.get(fy.closedById) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-white/80">
                  {snapshotsByFY.get(fy.id) ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
