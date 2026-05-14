import { prisma } from "@pt/db";
import { getProjectScope } from "@pt/shared";

import { ProjectListTable } from "@/components/project-list-table";
import { requireUser } from "@/lib/auth/guards";

export default async function CompletedProjectsPage() {
  const user = await requireUser();
  const isPM = user.role === "PROJECT_MANAGER";
  const scope = getProjectScope(user);

  const projects = await prisma.project.findMany({
    where: { AND: [scope, { isArchived: false, status: "COMPLETED" }] },
    include: { engineer: { select: { id: true, name: true } } },
    orderBy: { completedAt: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-sm uppercase tracking-wider text-white/40">Completed</p>
        <h1 className="mt-1 text-3xl font-semibold">Completed projects</h1>
        <p className="mt-1 text-sm text-white/60">
          Projects marked complete that haven&apos;t been archived yet.
        </p>
      </header>
      <ProjectListTable rows={projects} showEngineer={isPM} />
    </div>
  );
}
