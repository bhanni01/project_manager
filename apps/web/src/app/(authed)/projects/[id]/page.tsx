import Link from "next/link";

import { prisma } from "@pt/db";
import { computeProjectDerived } from "@pt/calc";
import { formatBSDate, formatNepaliCurrency, formatPercent } from "@pt/shared";

import { EoTAddForm } from "@/components/eot-add-form";
import { VOAddForm } from "@/components/vo-add-form";
import { requireUser } from "@/lib/auth/guards";
import { findScopedProjectOr404 } from "@/lib/project/scope";
import {
  archiveProjectAction,
  completeProjectAction,
  restoreProjectAction,
} from "@/lib/project/actions";

type TabKey = "summary" | "vos" | "eots" | "history";
const TAB_KEYS: TabKey[] = ["summary", "vos", "eots", "history"];

export default async function ProjectDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const { id } = await props.params;
  const { tab: tabParam, error, saved } = await props.searchParams;
  const tab: TabKey = (TAB_KEYS as string[]).includes(tabParam ?? "")
    ? (tabParam as TabKey)
    : "summary";

  const project = await findScopedProjectOr404(user, id);

  const [engineer, vos, eots, snapshots] = await Promise.all([
    prisma.user.findUnique({
      where: { id: project.engineerId },
      select: { name: true, email: true },
    }),
    prisma.variationOrder.findMany({
      where: { projectId: project.id },
      orderBy: { voNumber: "asc" },
    }),
    prisma.extensionOfTime.findMany({
      where: { projectId: project.id },
      orderBy: { eotNumber: "asc" },
    }),
    prisma.fiscalYearSnapshot.findMany({
      where: { projectId: project.id },
      include: { fiscalYear: { select: { label: true, startDate: true } } },
      orderBy: { fiscalYear: { startDate: "desc" } },
    }),
  ]);

  const latestVO = vos.at(-1);
  const latestEoT = eots.at(-1);

  const derived = computeProjectDerived(
    {
      originalContractPrice: project.originalContractPrice as unknown as string,
      priceEscalation: project.priceEscalation as unknown as string | null,
      contingencies: project.contingencies as unknown as string | null,
      latestVOAmount: latestVO
        ? (latestVO.revisedContractAmount as unknown as string)
        : null,
      latestEoTDate: latestEoT?.extendedToDate ?? null,
      paymentTillDate: project.paymentTillDate as unknown as string,
      paymentTillLastFY: project.paymentTillLastFY as unknown as string,
      totalAdvancePayment: project.totalAdvancePayment as unknown as string,
      outstandingAdvanceTillLastFY:
        project.outstandingAdvanceTillLastFY as unknown as string,
      outstandingAdvanceTillDate:
        project.outstandingAdvanceTillDate as unknown as string,
      currentFYBudget: project.currentFYBudget as unknown as string,
      expectedPaymentTillFYEnd:
        project.expectedPaymentTillFYEnd as unknown as string | null,
      physicalProgress: project.physicalProgress as unknown as string,
      status: project.status,
      intendedCompletionDate: project.intendedCompletionDate,
    },
    new Date(),
  );

  const isPM = user.role === "PROJECT_MANAGER";
  const canEdit =
    !project.isArchived && (isPM || project.engineerId === user.id);
  const canAddVOEoT = project.status === "RUNNING" && !project.isArchived;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <nav className="text-sm text-white/60">
        <Link className="hover:text-white" href="/projects">
          ← All projects
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold">{project.projectName}</h1>
            <Pill variant={project.infrastructureType === "ROAD" ? "blue" : "violet"}>
              {project.infrastructureType === "ROAD" ? "Road" : "Bridge"}
            </Pill>
            <Pill variant="neutral">{typeLabel(project.projectType)}</Pill>
            <StatusPill status={project.status} archived={project.isArchived} />
            {derived.isOverdue && <Pill variant="red">Overdue</Pill>}
            {derived.isOverpaid && <Pill variant="amber">Overpaid vs Progress</Pill>}
            {derived.isAdvanceNotRecovered && (
              <Pill variant="red">Advance not recovered</Pill>
            )}
            {derived.isDeficit && <Pill variant="red">Deficit</Pill>}
          </div>
          <p className="mt-2 text-sm text-white/60">
            Owner: <span className="text-white/80">{engineer?.name ?? "—"}</span>
            {engineer?.email && (
              <span className="text-white/40"> ({engineer.email})</span>
            )}
          </p>
          <p className="mt-1 text-sm text-white/60">
            Contract date{" "}
            <span className="text-white/80">
              {formatBSDate(project.contractDate, "long")}
            </span>
            {" · "}
            Intended completion{" "}
            <span className="text-white/80">
              {formatBSDate(project.intendedCompletionDate, "long")}
            </span>
            {derived.totalEoTDays > 0 && (
              <>
                {" · "}
                Revised completion{" "}
                <span className="text-white/80">
                  {formatBSDate(derived.revisedCompletionDate, "long")}
                </span>
                <span className="ml-1 rounded-md border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-xs text-amber-200">
                  +{derived.totalEoTDays} days
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/reports/single-project/${project.id}`}
            download
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Download Excel
          </a>
          {canEdit && (
            <Link
              href={`/projects/${project.id}/edit`}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Edit
            </Link>
          )}
          {!project.isArchived && project.status === "RUNNING" && canEdit && (
            <form action={completeProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <button
                type="submit"
                className="rounded-md border border-sky-400/40 bg-sky-400/10 px-3 py-1.5 text-sm text-sky-100 hover:bg-sky-400/20"
              >
                Mark complete
              </button>
            </form>
          )}
          {isPM && !project.isArchived && project.status === "COMPLETED" && (
            <form action={archiveProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <button
                type="submit"
                className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
              >
                Archive
              </button>
            </form>
          )}
          {isPM && project.isArchived && (
            <form action={restoreProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <button
                type="submit"
                className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-400/20"
              >
                Restore
              </button>
            </form>
          )}
        </div>
      </header>

      <nav className="flex gap-2 border-b border-white/10 text-sm">
        <TabLink projectId={project.id} active={tab === "summary"} tab="summary">
          Summary
        </TabLink>
        <TabLink projectId={project.id} active={tab === "vos"} tab="vos">
          VOs ({vos.length})
        </TabLink>
        <TabLink projectId={project.id} active={tab === "eots"} tab="eots">
          EoTs ({eots.length})
        </TabLink>
        <TabLink projectId={project.id} active={tab === "history"} tab="history">
          FY history
        </TabLink>
      </nav>

      {saved && (
        <p className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          Saved.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {errorMessage(error)}
        </p>
      )}

      {tab === "summary" && (
        <SummaryTab project={project} derived={derived} />
      )}
      {tab === "vos" && (
        <VOsTab projectId={project.id} vos={vos} canAdd={canAddVOEoT} status={project.status} archived={project.isArchived} />
      )}
      {tab === "eots" && (
        <EoTsTab
          projectId={project.id}
          eots={eots}
          intendedCompletionDate={project.intendedCompletionDate}
          canAdd={canAddVOEoT}
          status={project.status}
          archived={project.isArchived}
        />
      )}
      {tab === "history" && <HistoryTab snapshots={snapshots} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function TabLink({
  projectId,
  tab,
  active,
  children,
}: {
  projectId: string;
  tab: TabKey;
  active: boolean;
  children: React.ReactNode;
}) {
  const cls = active
    ? "border-b-2 border-white px-3 py-2 text-white"
    : "border-b-2 border-transparent px-3 py-2 text-white/50 hover:text-white";
  return (
    <Link href={`/projects/${projectId}?tab=${tab}`} className={cls}>
      {children}
    </Link>
  );
}

function errorMessage(code: string): string {
  switch (code) {
    case "not_running":
      return "VOs and EoTs can only be added while the project is Running.";
    case "eot_too_early":
      return "Extension date must be later than the previous EoT (or intended completion if none).";
    default:
      return "Something went wrong.";
  }
}

// ---------------------------------------------------------------------------
// Summary tab
// ---------------------------------------------------------------------------

function SummaryTab({
  project,
  derived,
}: {
  project: Awaited<ReturnType<typeof findScopedProjectOr404>>;
  derived: ReturnType<typeof computeProjectDerived>;
}) {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Current contract amount" value={formatNepaliCurrency(derived.currentContractAmount)} />
        <Metric label="Total revised cost" value={formatNepaliCurrency(derived.totalRevisedCost)} />
        <Metric label="Effective money out" value={formatNepaliCurrency(derived.effectiveMoneyOut)} />
        <Metric label="Overall financial progress" value={formatPercent(derived.overallFinancialProgressPct)} />
        <Metric label="Physical progress" value={formatPercent(project.physicalProgress as unknown as string)} />
        <Metric label="Current FY payment so far" value={formatNepaliCurrency(derived.currentFYPaymentSoFar)} />
        <Metric label="Current FY budget expenditure" value={formatPercent(derived.currentFYBudgetExpenditureProgressPct)} />
        <Metric label="Current FY surplus / deficit" value={formatNepaliCurrency(derived.currentFYSurplusDeficit)} />
        <Metric label="Current FY advance recovered" value={formatNepaliCurrency(derived.currentFYAdvanceRecovered)} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Raw figures</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Row k="Original contract price" v={formatNepaliCurrency(project.originalContractPrice as unknown as string)} />
          <Row k="Price escalation" v={formatNepaliCurrency(project.priceEscalation as unknown as string)} />
          <Row k="Contingencies" v={formatNepaliCurrency(project.contingencies as unknown as string)} />
          <Row k="Payment till last FY" v={formatNepaliCurrency(project.paymentTillLastFY as unknown as string)} />
          <Row k="Payment till date" v={formatNepaliCurrency(project.paymentTillDate as unknown as string)} />
          <Row k="Total advance payment" v={formatNepaliCurrency(project.totalAdvancePayment as unknown as string)} />
          <Row k="Outstanding advance (last FY)" v={formatNepaliCurrency(project.outstandingAdvanceTillLastFY as unknown as string)} />
          <Row k="Outstanding advance (to date)" v={formatNepaliCurrency(project.outstandingAdvanceTillDate as unknown as string)} />
          <Row k="Current FY budget" v={formatNepaliCurrency(project.currentFYBudget as unknown as string)} />
          <Row k="Expected payment till FY end" v={formatNepaliCurrency(project.expectedPaymentTillFYEnd as unknown as string)} />
          <Row k="Expected outstanding advance at FY end" v={formatNepaliCurrency(project.expectedOutstandingAdvanceFYEnd as unknown as string)} />
          <Row k="Next FY budget requirement" v={formatNepaliCurrency(project.nextFYBudgetRequirement as unknown as string)} />
        </dl>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// VOs tab
// ---------------------------------------------------------------------------

type VORow = {
  id: string;
  voNumber: number;
  revisedContractAmount: unknown;
  approvalDate: Date;
  description: string;
};

function VOsTab({
  projectId,
  vos,
  canAdd,
  status,
  archived,
}: {
  projectId: string;
  vos: VORow[];
  canAdd: boolean;
  status: "RUNNING" | "COMPLETED";
  archived: boolean;
}) {
  return (
    <section className="flex flex-col gap-4">
      {vos.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50">
          No variation orders yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wider text-white/50">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Approval date</th>
                <th className="px-4 py-3 text-right">Revised contract amount</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {vos.map((vo) => (
                <tr key={vo.id}>
                  <td className="px-4 py-3 font-medium text-white">VO-{vo.voNumber}</td>
                  <td className="px-4 py-3 text-white/70">{formatBSDate(vo.approvalDate, "short")}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/80">
                    {formatNepaliCurrency(vo.revisedContractAmount as string)}
                  </td>
                  <td className="px-4 py-3 text-white/70">{vo.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canAdd ? (
        <VOAddForm projectId={projectId} />
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
          Adding VOs is disabled because the project is{" "}
          {archived ? "archived" : status === "COMPLETED" ? "completed" : "not running"}.
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// EoTs tab
// ---------------------------------------------------------------------------

type EoTRow = {
  id: string;
  eotNumber: number;
  extendedToDate: Date;
  approvalDate: Date;
  reason: string;
};

function EoTsTab({
  projectId,
  eots,
  intendedCompletionDate,
  canAdd,
  status,
  archived,
}: {
  projectId: string;
  eots: EoTRow[];
  intendedCompletionDate: Date;
  canAdd: boolean;
  status: "RUNNING" | "COMPLETED";
  archived: boolean;
}) {
  // Compute days-added per row relative to its predecessor (or intended date).
  const rows = eots.map((eot, idx) => {
    const prev = idx === 0 ? intendedCompletionDate : eots[idx - 1]!.extendedToDate;
    const days = Math.round(
      (eot.extendedToDate.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );
    return { ...eot, days };
  });

  const latestDateISO =
    (eots.at(-1)?.extendedToDate ?? intendedCompletionDate).toISOString().slice(0, 10);

  return (
    <section className="flex flex-col gap-4">
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50">
          No extensions of time yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wider text-white/50">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Extended to</th>
                <th className="px-4 py-3">Approval date</th>
                <th className="px-4 py-3 text-right">Days added</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((eot) => (
                <tr key={eot.id}>
                  <td className="px-4 py-3 font-medium text-white">EoT-{eot.eotNumber}</td>
                  <td className="px-4 py-3 text-white/70">{formatBSDate(eot.extendedToDate, "short")}</td>
                  <td className="px-4 py-3 text-white/70">{formatBSDate(eot.approvalDate, "short")}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/80">+{eot.days}</td>
                  <td className="px-4 py-3 text-white/70">{eot.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canAdd ? (
        <EoTAddForm projectId={projectId} floorISO={latestDateISO} />
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
          Adding EoTs is disabled because the project is{" "}
          {archived ? "archived" : status === "COMPLETED" ? "completed" : "not running"}.
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
      <dt className="text-white/60">{k}</dt>
      <dd className="font-medium tabular-nums text-white/80">{v}</dd>
    </div>
  );
}

function typeLabel(t: "MULTIYEAR" | "SOURCE_APPROVED" | "YEARLY_TENDERED"): string {
  switch (t) {
    case "MULTIYEAR":
      return "Multiyear";
    case "SOURCE_APPROVED":
      return "Source Approved";
    case "YEARLY_TENDERED":
      return "Yearly Tendered";
  }
}

function Pill({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "blue" | "violet" | "neutral" | "red" | "amber";
}) {
  const cls =
    variant === "blue"
      ? "border-sky-400/40 bg-sky-400/10 text-sky-100"
      : variant === "violet"
        ? "border-violet-400/40 bg-violet-400/10 text-violet-100"
        : variant === "red"
          ? "border-red-400/40 bg-red-400/10 text-red-200"
          : variant === "amber"
            ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
            : "border-white/15 bg-white/10 text-white/70";
  return (
    <span className={`rounded-md border px-2 py-0.5 text-xs ${cls}`}>{children}</span>
  );
}

function StatusPill({
  status,
  archived,
}: {
  status: "RUNNING" | "COMPLETED";
  archived: boolean;
}) {
  if (archived) return <Pill variant="neutral">Archived</Pill>;
  if (status === "COMPLETED") return <Pill variant="blue">Completed</Pill>;
  return (
    <span className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200">
      Running
    </span>
  );
}

// ---------------------------------------------------------------------------
// FY history tab
// ---------------------------------------------------------------------------

type SnapshotRow = {
  id: string;
  fiscalYear: { label: string };
  openingPayment: unknown;
  closingPayment: unknown;
  fyPayment: unknown;
  fyBudget: unknown;
  fyAdvanceRecovered: unknown;
  physicalProgress: unknown;
  financialProgress: unknown;
  surplusDeficit: unknown;
};

function HistoryTab({ snapshots }: { snapshots: SnapshotRow[] }) {
  if (snapshots.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50">
        No snapshots yet. The first one lands after the PM rolls over the fiscal year.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-4 py-3">FY</th>
            <th className="px-4 py-3 text-right">Opening payment</th>
            <th className="px-4 py-3 text-right">Closing payment</th>
            <th className="px-4 py-3 text-right">FY payment</th>
            <th className="px-4 py-3 text-right">FY budget</th>
            <th className="px-4 py-3 text-right">Advance recovered</th>
            <th className="px-4 py-3 text-right">Physical %</th>
            <th className="px-4 py-3 text-right">Financial %</th>
            <th className="px-4 py-3 text-right">Surplus / deficit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {snapshots.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 font-medium text-white">{s.fiscalYear.label}</td>
              <td className="px-4 py-3 text-right tabular-nums text-white/80">
                {formatNepaliCurrency(s.openingPayment as string)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-white/80">
                {formatNepaliCurrency(s.closingPayment as string)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-white/80">
                {formatNepaliCurrency(s.fyPayment as string)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-white/80">
                {formatNepaliCurrency(s.fyBudget as string)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-white/80">
                {formatNepaliCurrency(s.fyAdvanceRecovered as string)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-white/80">
                {formatPercent(s.physicalProgress as string)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-white/80">
                {formatPercent(s.financialProgress as string)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-white/80">
                {formatNepaliCurrency(s.surplusDeficit as string)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
