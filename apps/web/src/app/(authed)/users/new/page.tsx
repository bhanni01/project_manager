import Link from "next/link";

import { requireRole } from "@/lib/auth/guards";
import { createUserAction } from "@/lib/users/actions";

export default async function NewUserPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole("PROJECT_MANAGER");
  const { error } = await props.searchParams;

  const errorMessage =
    error === "email_taken"
      ? "An account with that email already exists."
      : error
        ? "Something went wrong. Please try again."
        : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <nav className="text-sm text-white/60">
        <Link className="hover:text-white" href="/users">
          ← All users
        </Link>
      </nav>

      <header>
        <p className="text-sm uppercase tracking-wider text-white/40">New user</p>
        <h1 className="mt-1 text-3xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-white/60">
          A 10-character temporary password is generated and shown once after
          you submit. Share it with the user offline.
        </p>
      </header>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {errorMessage}
        </p>
      )}

      <form action={createUserAction} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <Field label="Name">
          <input
            type="text"
            name="name"
            required
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            name="email"
            required
            autoComplete="off"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
          />
        </Field>
        <Field label="Role">
          <select
            name="role"
            required
            defaultValue="ENGINEER"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
          >
            <option value="ENGINEER">Engineer</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
          </select>
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Create account
          </button>
          <Link href="/users" className="text-sm text-white/60 hover:text-white">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-white/70">{label}</span>
      {children}
    </label>
  );
}
