import { prisma } from "@pt/db";

import { ProjectListTable } from "@/components/project-list-table";
import { requireRole } from "@/lib/auth/guards";

export default async function ArchivePage() {
  await requireRole("PROJECT_MANAGER");

  const projects = await prisma.project.findMany({
    where: { isArchived: true },
    include: { engineer: { select: { id: true, name: true } } },
    orderBy: { archivedAt: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-sm uppercase tracking-wider text-white/40">Archive</p>
        <h1 className="mt-1 text-3xl font-semibold">Archived projects</h1>
        <p className="mt-1 text-sm text-white/60">
          PM-only view. Open a project to restore it from its detail page.
        </p>
      </header>
      <ProjectListTable rows={projects} showEngineer showRestoreAction />
    </div>
  );
}
