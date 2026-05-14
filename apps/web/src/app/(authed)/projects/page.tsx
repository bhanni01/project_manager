import Link from "next/link";

import { prisma, type Prisma } from "@pt/db";
import { getProjectScope } from "@pt/shared";

import { ProjectListTable } from "@/components/project-list-table";
import { requireUser } from "@/lib/auth/guards";

export default async function ProjectsPage(props: {
  searchParams: Promise<{ infrastructure?: string; type?: string; engineerId?: string }>;
}) {
  const user = await requireUser();
  const isPM = user.role === "PROJECT_MANAGER";
  const scope = getProjectScope(user);
  const filters = await props.searchParams;

  const andConditions: Prisma.ProjectWhereInput[] = [
    scope,
    { isArchived: false, status: "RUNNING" },
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
  if (isPM && filters.engineerId) {
    andConditions.push({ engineerId: filters.engineerId });
  }
  const where: Prisma.ProjectWhereInput = { AND: andConditions };

  const [projects, engineers] = await Promise.all([
    prisma.project.findMany({
      where,
      include: { engineer: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    isPM
      ? prisma.user.findMany({
          where: { role: "ENGINEER", isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-white/40">Active projects</p>
          <h1 className="mt-1 text-3xl font-semibold">Projects</h1>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
        >
          New project
        </Link>
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
        {isPM && (
          <Filter name="engineerId" label="Engineer" value={filters.engineerId}>
            <option value="">All engineers</option>
            {engineers.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Filter>
        )}
        <button
          type="submit"
          className="rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
        >
          Apply
        </button>
        <Link
          href="/projects"
          className="rounded-md px-3 py-1.5 text-sm text-white/60 hover:text-white"
        >
          Reset
        </Link>
      </form>

      <ProjectListTable rows={projects} showEngineer={isPM} />
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
