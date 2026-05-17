import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@pt/db";

import { FlashToast } from "@/components/flash-toast";
import { TempPasswordBanner } from "@/components/temp-password-banner";
import { requireRole } from "@/lib/auth/guards";
import {
  deactivateUserAction,
  reactivateUserAction,
  resetUserPasswordAction,
  updateUserAction,
} from "@/lib/users/actions";

export default async function EditUserPage(props: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("PROJECT_MANAGER");
  const { id } = await props.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  const isSelf = user.id === actor.id;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <nav className="text-sm text-white/60">
        <Link className="hover:text-white" href="/users">
          ← All users
        </Link>
      </nav>

      <header>
        <p className="text-sm uppercase tracking-wider text-white/40">Edit user</p>
        <h1 className="mt-1 text-3xl font-semibold">{user.name}</h1>
        <p className="mt-1 text-sm text-white/60">{user.email}</p>
      </header>

      <TempPasswordBanner />
      <FlashToast
        messages={{
          self_role_change: "You cannot change your own role.",
          self_deactivate: "You cannot deactivate yourself.",
          last_pm: "Cannot demote or deactivate the only active project manager.",
          not_found: "User not found.",
        }}
      />

      <form
        action={updateUserAction}
        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <input type="hidden" name="id" value={user.id} />

        <Field label="Email">
          <input
            type="email"
            value={user.email}
            disabled
            className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/50"
          />
          <span className="text-xs text-white/40">
            Email is read-only. Deactivate and recreate if it must change.
          </span>
        </Field>

        <Field label="Name">
          <input
            type="text"
            name="name"
            required
            defaultValue={user.name}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
          />
        </Field>

        <Field label="Role">
          <select
            name="role"
            required
            defaultValue={user.role}
            disabled={isSelf}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30 disabled:opacity-50"
          >
            <option value="ENGINEER">Engineer</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
          </select>
          {isSelf && (
            <span className="text-xs text-white/40">
              You cannot change your own role.
            </span>
          )}
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Save changes
          </button>
          <Link href="/users" className="text-sm text-white/60 hover:text-white">
            Cancel
          </Link>
        </div>
      </form>

      <section className="flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6">
        <header>
          <h2 className="text-sm font-semibold text-red-200">Danger zone</h2>
          <p className="mt-1 text-xs text-white/50">
            Password resets and deactivations write to the audit log.
          </p>
        </header>

        <div className="flex flex-wrap gap-3">
          <form action={resetUserPasswordAction}>
            <input type="hidden" name="id" value={user.id} />
            <button
              type="submit"
              className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-400/20"
            >
              Reset password
            </button>
          </form>

          {user.isActive ? (
            <form action={deactivateUserAction}>
              <input type="hidden" name="id" value={user.id} />
              <button
                type="submit"
                disabled={isSelf}
                className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-50"
              >
                Deactivate user
              </button>
            </form>
          ) : (
            <form action={reactivateUserAction}>
              <input type="hidden" name="id" value={user.id} />
              <button
                type="submit"
                className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-400/20"
              >
                Reactivate user
              </button>
            </form>
          )}
        </div>
      </section>
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
