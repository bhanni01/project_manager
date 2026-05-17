import Link from "next/link";
import Decimal from "decimal.js";

import { prisma, type Prisma } from "@pt/db";
import { toDecimal } from "@pt/calc";
import { formatNepaliCurrency } from "@pt/shared";

import { requireRole } from "@/lib/auth/guards";

export default async function BudgetPlanningPage(props: {
  searchParams: Promise<{ infrastructure?: string; type?: string }>;
}) {
  await requireRole("PROJECT_MANAGER");
  const filters = await props.searchParams;

  const andConditions: Prisma.ProjectWhereInput[] = [
    { isArchived: false },
  ];
  if (filters.infrastructure === "ROAD" || filters.infrastructure === "BRIDGE") {
    andConditions.push({ infrastructureType: filters.infrastructure });
  }
  if (
    filters.type === "MULTIYEAR" ||
    filters.type === "SOURCE_APPROVED" ||
    filters.type === "YEARLY_TENDERED"
  ) {
    andConditions.push({ projectType: filters.type });
  }

  const [currentFY, projects] = await Promise.all([
    prisma.fiscalYear.findFirst({ where: { isCurrent: true } }),
    prisma.project.findMany({
      where: { AND: andConditions },
      include: { engineer: { select: { id: true, name: true } } },
      orderBy: { projectName: "asc" },
    }),
  ]);

  const totals = projects.reduce(
    (acc, p) => {
      const budget = toDecimal(p.currentFYBudget as unknown as string);
      const expected = toDecimal((p.expectedPaymentTillFYEnd as unknown as string) ?? null);
      const expectedAdv = toDecimal(
        (p.expectedOutstandingAdvanceFYEnd as unknown as string) ?? null,
      );
      const next = toDecimal((p.nextFYBudgetRequirement as unknown as string) ?? null);
      const surplus = budget.minus(expected);
      return {
        budget: acc.budget.plus(budget),
        expected: acc.expected.plus(expected),
        expectedAdv: acc.expectedAdv.plus(expectedAdv),
        next: acc.next.plus(next),
        surplus: acc.surplus.plus(surplus),
      };
    },
    {
      budget: new Decimal(0),
      expected: new Decimal(0),
      expectedAdv: new Decimal(0),
      next: new Decimal(0),
      surplus: new Decimal(0),
    },
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-white/40">Budget Planning</p>
          <h1 className="mt-1 text-3xl font-semibold">
            Budget Planning for FY {currentFY?.label ?? "—"}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            PM-only. Forecast figures across all non-archived projects. These fields are cleared
            on FY rollover.
          </p>
        </div>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <Filter name="infrastructure" label="Infrastructure" value={filters.infrastructure}>
          <option value="">All</option>
          <option value="ROAD">Road</option>
          <option value="BRIDGE">Bridge</option>
        </Filter>
        <Filter name="type" label="Type" value={filters.type}>
          <option value="">All</option>
          <option value="MULTIYEAR">Multiyear</option>
          <option value="SOURCE_APPROVED">Source Approved</option>
          <option value="YEARLY_TENDERED">Yearly Tendered</option>
        </Filter>
        <button
          type="submit"
          className="rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
        >
          Apply
        </button>
        <Link
          href="/budget-planning"
          className="rounded-md px-3 py-1.5 text-sm text-white/60 hover:text-white"
        >
          Reset
        </Link>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="sticky-thead bg-white/[0.04] text-left text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Engineer</th>
              <th className="px-4 py-3 text-right">Current FY budget</th>
              <th className="px-4 py-3 text-right">Expected payment till FY end</th>
              <th className="px-4 py-3 text-right">Expected outstanding advance</th>
              <th className="px-4 py-3 text-right">Next FY budget requirement</th>
              <th className="px-4 py-3 text-right">Surplus / deficit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {projects.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-white/50">
                  No projects match the filters.
                </td>
              </tr>
            )}
            {projects.map((p) => {
              const budget = p.currentFYBudget as unknown as string;
              const expected = p.expectedPaymentTillFYEnd as unknown as string | null;
              const expectedAdv = p.expectedOutstandingAdvanceFYEnd as unknown as string | null;
              const next = p.nextFYBudgetRequirement as unknown as string | null;
              const surplus = toDecimal(budget).minus(toDecimal(expected));
              return (
                <tr key={p.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium text-white">
                    <Link href={`/projects/${p.id}/edit`} className="hover:underline">
                      {p.projectName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/70">{p.engineer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/80">
                    {formatNepaliCurrency(budget)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/80">
                    {formatNepaliCurrency(expected)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/80">
                    {formatNepaliCurrency(expectedAdv)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/80">
                    {formatNepaliCurrency(next)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${
                      surplus.isNegative() ? "text-red-300" : "text-white/80"
                    }`}
                  >
                    {formatNepaliCurrency(surplus)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-white/[0.04]">
            <tr>
              <td colSpan={2} className="px-4 py-3 text-xs uppercase tracking-wider text-white/50">
                Totals
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">
                {formatNepaliCurrency(totals.budget)}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">
                {formatNepaliCurrency(totals.expected)}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">
                {formatNepaliCurrency(totals.expectedAdv)}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">
                {formatNepaliCurrency(totals.next)}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">
                {formatNepaliCurrency(totals.surplus)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Filter({
  name,
  label,
  value,
  children,
}: {
  name: string;
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-white/60">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm outline-none focus:border-white/30"
      >
        {children}
      </select>
    </label>
  );
}
