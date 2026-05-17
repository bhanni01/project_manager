import { prisma } from "@pt/db";

import { requireRole } from "@/lib/auth/guards";

export default async function ReportsPage() {
  await requireRole("PROJECT_MANAGER");

  const [projects, engineers] = await Promise.all([
    prisma.project.findMany({
      select: { id: true, projectName: true, engineer: { select: { name: true } } },
      orderBy: { projectName: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ENGINEER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-sm uppercase tracking-wider text-white/40">Reports</p>
        <h1 className="mt-1 text-3xl font-semibold">Excel exports</h1>
        <p className="mt-1 text-sm text-white/60">
          Each report downloads a multi-sheet workbook with Nepali currency formatting and
          frozen headers.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <ReportCard
          title="Single Project"
          description="Summary + Variation Orders + EoTs + FY History + Advance Ledger for one project."
        >
          <SingleProjectPicker projects={projects} />
        </ReportCard>

        <ReportCard
          title="Project List"
          description="All non-archived projects with derived values, color-scaled by financial progress."
        >
          <form method="get" action="/api/reports/project-list" className="flex flex-col gap-3">
            <FilterSelect name="infrastructure" label="Infrastructure">
              <option value="">All</option>
              <option value="ROAD">Road</option>
              <option value="BRIDGE">Bridge</option>
            </FilterSelect>
            <FilterSelect name="type" label="Type">
              <option value="">All</option>
              <option value="MULTIYEAR">Multiyear</option>
              <option value="SOURCE_APPROVED">Source Approved</option>
              <option value="YEARLY_TENDERED">Yearly Tendered</option>
            </FilterSelect>
            <FilterSelect name="engineerId" label="Engineer">
              <option value="">All</option>
              {engineers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </FilterSelect>
            <DownloadButton />
          </form>
        </ReportCard>

        <ReportCard
          title="Completed Projects"
          description="Completed list, totals by engineer + year, cost variance ranked high-to-low."
        >
          <a
            href="/api/reports/completed"
            download
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Download Excel
          </a>
        </ReportCard>

        <ReportCard
          title="Budget Planning"
          description="Forecast figures across all non-archived projects with totals and deficit count."
        >
          <a
            href="/api/reports/budget-planning"
            download
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Download Excel
          </a>
        </ReportCard>

        <ReportCard
          title="Office Dashboard"
          description="KPIs, per-engineer rollup, and FY trend across all closed and current fiscal years."
        >
          <a
            href="/api/reports/office-dashboard"
            download
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Download Excel
          </a>
        </ReportCard>
      </section>
    </div>
  );
}

function ReportCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
      <header>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-white/60">{description}</p>
      </header>
      <div className="mt-2 flex flex-col gap-3">{children}</div>
    </article>
  );
}

function FilterSelect({
  name,
  label,
  children,
}: {
  name: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-white/60">
      {label}
      <select
        name={name}
        defaultValue=""
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm outline-none focus:border-white/30"
      >
        {children}
      </select>
    </label>
  );
}

function DownloadButton() {
  return (
    <button
      type="submit"
      className="self-start rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
    >
      Download Excel
    </button>
  );
}

function SingleProjectPicker({
  projects,
}: {
  projects: { id: string; projectName: string; engineer: { name: string } | null }[];
}) {
  // The form action points dynamically to /api/reports/single-project/[id]. To
  // do that without JS, we render one anchor per project? That's a lot. Instead,
  // use a small client-free pattern: a select + a Download button that uses the
  // browser's native submit-as-link by setting the form's `action` via the
  // select's selected option. Simpler: render anchors as a clickable list.
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-white/60">Pick a project:</span>
      <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-md border border-white/10 bg-black/20 p-2">
        {projects.length === 0 && (
          <p className="px-2 py-1 text-sm text-white/40">No projects yet.</p>
        )}
        {projects.map((p) => (
          <a
            key={p.id}
            href={`/api/reports/single-project/${p.id}`}
            download
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-white/10"
          >
            <span className="text-white/80">{p.projectName}</span>
            <span className="text-xs text-white/40">{p.engineer?.name ?? "—"}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
