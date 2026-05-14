import { prisma } from "@pt/db";

import { ProjectForm } from "@/components/project-form";
import { requireUser } from "@/lib/auth/guards";
import { updateProject } from "@/lib/project/actions";
import { findEditableProjectOr404 } from "@/lib/project/scope";

export default async function EditProjectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await props.params;
  const project = await findEditableProjectOr404(user, id);

  const isPM = user.role === "PROJECT_MANAGER";

  const engineers = isPM
    ? await prisma.user.findMany({
        where: { role: "ENGINEER", isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : undefined;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-sm uppercase tracking-wider text-white/40">Edit project</p>
        <h1 className="mt-1 text-3xl font-semibold">{project.projectName}</h1>
      </header>

      <ProjectForm
        mode="edit"
        action={updateProject}
        project={project}
        isPM={isPM}
        engineers={engineers}
      />
    </div>
  );
}
