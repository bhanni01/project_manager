import Link from "next/link";

import type { Project, User } from "@pt/db";
import { formatBSDate, formatNepaliCurrency } from "@pt/shared";

type ProjectRow = Project & { engineer?: Pick<User, "id" | "name"> | null };

export function ProjectListTable({
  rows,
  showEngineer,
  showRestoreAction,
}: {
  rows: ProjectRow[];
  showEngineer: boolean;
  showRestoreAction?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50">
        No projects yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="sticky-thead bg-white/[0.04] text-left text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            {showEngineer && <th className="px-4 py-3">Engineer</th>}
            <th className="px-4 py-3">Contract date</th>
            <th className="px-4 py-3 text-right">Original price</th>
            {showRestoreAction && <th className="px-4 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-white/[0.03]">
              <td className="px-4 py-3">
                <Link
                  href={`/projects/${p.id}`}
                  className="font-medium text-white hover:underline"
                >
                  {p.projectName}
                </Link>
                <p className="text-xs text-white/40">
                  {p.infrastructureType === "ROAD" ? "Road" : "Bridge"}
                </p>
              </td>
              <td className="px-4 py-3 text-white/70">
                {labelForType(p.projectType)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={p.status} archived={p.isArchived} />
              </td>
              {showEngineer && (
                <td className="px-4 py-3 text-white/70">
                  {p.engineer?.name ?? "—"}
                </td>
              )}
              <td className="px-4 py-3 text-white/70">
                {formatBSDate(p.contractDate, "short")}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-white/80">
                {formatNepaliCurrency(p.originalContractPrice as unknown as string)}
              </td>
              {showRestoreAction && (
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-xs text-white/70 hover:text-white"
                  >
                    Open →
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function labelForType(t: Project["projectType"]): string {
  switch (t) {
    case "MULTIYEAR":
      return "Multiyear";
    case "SOURCE_APPROVED":
      return "Source Approved";
    case "YEARLY_TENDERED":
      return "Yearly Tendered";
  }
}

function StatusBadge({
  status,
  archived,
}: {
  status: Project["status"];
  archived: boolean;
}) {
  if (archived) {
    return (
      <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-xs text-white/60">
        Archived
      </span>
    );
  }
  if (status === "COMPLETED") {
    return (
      <span className="rounded-md border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 text-xs text-sky-200">
        Completed
      </span>
    );
  }
  return (
    <span className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200">
      Running
    </span>
  );
}
