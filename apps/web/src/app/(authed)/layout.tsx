import Link from "next/link";

import { signOut } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/toaster";
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
      <header className="glass sticky top-0 z-30 border-b border-edge">
        <nav className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-3 text-sm">
          <Link
            href="/dashboard"
            className="mr-4 text-base font-semibold accent-gradient-text"
          >
            Project Tracker
          </Link>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/projects">Projects</NavLink>
          <NavLink href="/projects/completed">Completed</NavLink>
          {isPM && <NavLink href="/projects/archive">Archive</NavLink>}
          {isPM && <NavLink href="/budget-planning">Budget</NavLink>}
          {isPM && <NavLink href="/fiscal-year">Fiscal Year</NavLink>}
          {isPM && <NavLink href="/reports">Reports</NavLink>}
          {isPM && <NavLink href="/users">Users</NavLink>}

          <div className="ml-auto flex items-center gap-3 text-fg-muted">
            <span className="hidden text-xs opacity-80 sm:inline">
              {user.name} · {user.role}
            </span>
            <ThemeToggle className="glass glow rounded-md p-2 text-fg transition" />
            <form action={signOutAction}>
              <button
                type="submit"
                className="glass glow rounded-md px-3 py-1.5 text-sm text-fg transition"
              >
                Sign out
              </button>
            </form>
          </div>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
      <Toaster />
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
      className="rounded-md px-3 py-1.5 text-fg-muted transition hover:bg-fg/10 hover:text-fg"
    >
      {children}
    </Link>
  );
}
