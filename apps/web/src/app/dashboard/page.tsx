import { signOut } from "@/auth";
import { requireUser } from "@/lib/auth/guards";

async function signOutAction(): Promise<void> {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function DashboardPage() {
  const user = await requireUser();
  const isPM = user.role === "PROJECT_MANAGER";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wider text-white/40">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold">
            Welcome, {user.name}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Signed in as{" "}
            <span className="font-medium text-white/80">{user.email}</span>
            {" · "}
            <span className="font-medium text-white/80">{user.role}</span>
          </p>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">
          {isPM ? "Office-wide dashboard" : "Your projects dashboard"}
        </h2>
        <p className="mt-2 text-sm text-white/60">
          {isPM
            ? "Once project data exists you'll see all engineers' projects, KPIs, and the fiscal year controls here."
            : "Once you create your first project it will appear here with a summary of your active work."}
        </p>
        <p className="mt-4 text-xs text-white/40">
          (Placeholder — content lands in Step 3 onward.)
        </p>
      </section>
    </main>
  );
}
