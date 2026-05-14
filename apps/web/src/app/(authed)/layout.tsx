import Link from "next/link";

import { signOut } from "@/auth";
import { requireUser } from "@/lib/auth/guards";

async function signOutAction(): Promise<void> {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const isPM = user.role === "PROJECT_MANAGER";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/10 bg-white/[0.02] backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-3 text-sm">
          <Link
            href="/dashboard"
            className="mr-4 text-base font-semibold text-white"
          >
            Project Tracker
          </Link>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/projects">Projects</NavLink>
          <NavLink href="/projects/completed">Completed</NavLink>
          {isPM && <NavLink href="/projects/archive">Archive</NavLink>}

          <div className="ml-auto flex items-center gap-3 text-white/60">
            <span className="hidden sm:inline">
              {user.name} · {user.role}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-white/80 transition hover:bg-white/10"
              >
                Sign out
              </button>
            </form>
          </div>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </Link>
  );
}
