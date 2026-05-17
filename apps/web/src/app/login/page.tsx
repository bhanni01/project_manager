import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";

import { loginAction } from "./actions";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { error } = await props.searchParams;
  const errorMessage =
    error === "credentials"
      ? "Invalid email or password."
      : error
        ? "Something went wrong. Please try again."
        : null;

  return (
    <main className="relative flex flex-1 items-center justify-center px-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle className="glass glow rounded-md p-2 text-fg transition" />
      </div>

      <div className="glass glow w-full max-w-sm rounded-2xl p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-semibold accent-gradient-text">
          Project Tracker
        </h1>
        <p className="mb-6 text-sm text-fg-muted">Sign in to continue.</p>

        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-fg">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-fg">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            />
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="accent-gradient glow w-full rounded-md px-3 py-2 text-sm font-medium text-white transition"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-xs text-fg-muted opacity-60">
          Dev credentials are printed by <code>pnpm --filter @pt/db db:seed</code>.
        </p>
      </div>
    </main>
  );
}
