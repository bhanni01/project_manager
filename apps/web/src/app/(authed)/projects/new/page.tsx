import { prisma } from "@pt/db";

import { ProjectForm } from "@/components/project-form";
import { requireUser } from "@/lib/auth/guards";
import { createProject } from "@/lib/project/actions";

export default async function NewProjectPage() {
  const user = await requireUser();
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
        <p className="text-sm uppercase tracking-wider text-white/40">New project</p>
        <h1 className="mt-1 text-3xl font-semibold">Create project</h1>
        <p className="mt-1 text-sm text-white/60">
          {isPM
            ? "Pick the owning engineer in Section 9."
            : "You'll automatically be assigned as the owning engineer."}
        </p>
      </header>

      <ProjectForm
        mode="create"
        action={createProject}
        isPM={isPM}
        engineers={engineers}
      />
    </div>
  );
}
