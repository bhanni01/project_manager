import Link from "next/link";

import { prisma } from "@pt/db";
import { computeProjectDerived } from "@pt/calc";
import { formatBSDate, formatNepaliCurrency, formatPercent } from "@pt/shared";

import { requireUser } from "@/lib/auth/guards";
import { findScopedProjectOr404 } from "@/lib/project/scope";
import {
  archiveProjectAction,
  completeProjectAction,
  restoreProjectAction,
} from "@/lib/project/actions";

export default async function ProjectDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await props.params;
  const project = await findScopedProjectOr404(user, id);

  const engineer = await prisma.user.findUnique({
    where: { id: project.engineerId },
    select: { name: true, email: true },
  });

  const derived = computeProjectDerived(
    {
      originalContractPrice: project.originalContractPrice as unknown as string,
      priceEscalation: project.priceEscalation as unknown as string | null,
      contingencies: project.contingencies as unknown as string | null,
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
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
        <Tab active>Summary</Tab>
        <Tab>VOs</Tab>
        <Tab>EoTs</Tab>
        <Tab>FY history</Tab>
      </nav>

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

      <p className="text-xs text-white/40">
        VOs, EoTs and FY history tabs become real in Step 5.
      </p>
    </div>
  );
}

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

function Tab({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={
        active
          ? "border-b-2 border-white px-3 py-2 text-white"
          : "border-b-2 border-transparent px-3 py-2 text-white/40"
      }
    >
      {children}
    </span>
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
