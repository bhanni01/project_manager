import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@pt/db";
import { formatBSDate, formatNepaliCurrency, formatPercent } from "@pt/shared";

import { requireRole } from "@/lib/auth/guards";
import { rolloverFiscalYearAction } from "@/lib/fiscal-year/actions";
import { buildRolloverPreview, loadPreviewProjects } from "@/lib/fiscal-year/preview";

export default async function FiscalYearPreviewPage(props: {
  searchParams: Promise<{ label?: string; startDate?: string; endDate?: string }>;
}) {
  await requireRole("PROJECT_MANAGER");
  const { label, startDate, endDate } = await props.searchParams;

  if (!label || !startDate || !endDate) {
    redirect("/fiscal-year/new");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    redirect("/fiscal-year/new?error=dates_invalid");
  }

  const [currentFY, existingNext, projects] = await Promise.all([
    prisma.fiscalYear.findFirst({ where: { isCurrent: true } }),
    prisma.fiscalYear.findUnique({ where: { label } }),
    loadPreviewProjects(prisma),
  ]);

  if (!currentFY) redirect("/fiscal-year/new?error=no_current_fy");
  if (existingNext) redirect("/fiscal-year/new?error=label_taken");

  const { rows, totals } = buildRolloverPreview(projects);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <nav className="text-sm text-white/60">
        <Link className="hover:text-white" href="/fiscal-year/new">
          ← Back to form
        </Link>
      </nav>

      <header>
        <p className="text-sm uppercase tracking-wider text-amber-200">Dry run preview</p>
        <h1 className="mt-1 text-3xl font-semibold">Confirm fiscal year rollover</h1>
        <p className="mt-1 text-sm text-white/60">
          Nothing has been written yet. Click Confirm to commit the changes below in a single
          atomic transaction.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card title="Closing FY">
          <p className="text-2xl font-semibold">{currentFY.label}</p>
          <p className="mt-1 text-sm text-white/60">
            {formatBSDate(currentFY.startDate, "long")} →{" "}
            {formatBSDate(currentFY.endDate, "long")}
          </p>
        </Card>
        <Card title="Opening FY">
          <p className="text-2xl font-semibold">{label}</p>
          <p className="mt-1 text-sm text-white/60">
            {formatBSDate(start, "long")} → {formatBSDate(end, "long")}
          </p>
        </Card>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5">
        <header className="border-b border-white/10 px-6 py-4">
          <h2 className="text-base font-semibold">
            {rows.length} non-archived project{rows.length === 1 ? "" : "s"} will be snapshot
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Forecast fields cleared; <code>currentFYBudget</code> set to
            <code className="ml-1 rounded bg-white/10 px-1">nextFYBudgetRequirement</code>.
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wider text-white/50">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Engineer</th>
                <th className="px-4 py-3 text-right">FY payment</th>
                <th className="px-4 py-3 text-right">FY budget</th>
                <th className="px-4 py-3 text-right">Surplus / deficit</th>
                <th className="px-4 py-3 text-right">Financial %</th>
                <th className="px-4 py-3 text-right">Next FY budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => (
                <tr key={r.projectId}>
                  <td className="px-4 py-3 font-medium text-white">{r.projectName}</td>
                  <td className="px-4 py-3 text-white/70">{r.engineerName}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/80">
                    {formatNepaliCurrency(r.fyPayment)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/80">
                    {formatNepaliCurrency(r.fyBudget)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${
                      r.surplusDeficit.isNegative() ? "text-red-300" : "text-white/80"
                    }`}
                  >
                    {formatNepaliCurrency(r.surplusDeficit)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/80">
                    {formatPercent(r.financialProgress)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/80">
                    {formatNepaliCurrency(r.newCurrentFYBudget)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-white/[0.04]">
              <tr>
                <td className="px-4 py-3 text-xs uppercase tracking-wider text-white/50" colSpan={2}>
                  Totals
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">
                  {formatNepaliCurrency(totals.fyPayment)}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">
                  {formatNepaliCurrency(totals.fyBudget)}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">
                  {formatNepaliCurrency(totals.surplusDeficit)}
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">
                  {formatNepaliCurrency(totals.newCurrentFYBudget)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <form action={rolloverFiscalYearAction} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="nextLabel" value={label} />
        <input type="hidden" name="startDate" value={startDate} />
        <input type="hidden" name="endDate" value={endDate} />
        <button
          type="submit"
          className="rounded-md bg-amber-400/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
        >
          Confirm rollover
        </button>
        <Link
          href="/fiscal-year/new"
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
        >
          Cancel
        </Link>
      </form>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-wider text-white/40">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
