import Link from "next/link";

import type { Role } from "@pt/db";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  runningProjects: number;
  completedProjects: number;
}

export function UserListTable({
  rows,
  currentUserId,
}: {
  rows: UserRow[];
  currentUserId: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50">
        No users yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Running</th>
            <th className="px-4 py-3 text-right">Completed</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((u) => {
            const muted = !u.isActive;
            const isSelf = u.id === currentUserId;
            return (
              <tr
                key={u.id}
                className={`hover:bg-white/[0.03] ${muted ? "text-white/40" : ""}`}
              >
                <td className="px-4 py-3 font-medium text-white">
                  {u.name}
                  {isSelf && (
                    <span className="ml-2 rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/60">
                      You
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <RolePill role={u.role} />
                </td>
                <td className="px-4 py-3">
                  {u.isActive ? (
                    <span className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-xs text-white/60">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{u.runningProjects}</td>
                <td className="px-4 py-3 text-right tabular-nums">{u.completedProjects}</td>
                <td className="px-4 py-3 text-white/60">
                  {u.createdAt.toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/users/${u.id}/edit`}
                    className="text-xs text-white/70 hover:text-white"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RolePill({ role }: { role: Role }) {
  if (role === "PROJECT_MANAGER") {
    return (
      <span className="rounded-md border border-violet-400/40 bg-violet-400/10 px-2 py-0.5 text-xs text-violet-100">
        Project Manager
      </span>
    );
  }
  return (
    <span className="rounded-md border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 text-xs text-sky-100">
      Engineer
    </span>
  );
}
