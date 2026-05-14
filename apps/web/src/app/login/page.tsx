import { redirect } from "next/navigation";

import { auth } from "@/auth";

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
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <h1 className="mb-1 text-2xl font-semibold">Project Tracker</h1>
        <p className="mb-6 text-sm text-white/60">Sign in to continue.</p>

        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-white/80">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-white/80">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
            />
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-xs text-white/40">
          Dev credentials are printed by <code>pnpm --filter @pt/db db:seed</code>.
        </p>
      </div>
    </main>
  );
}
