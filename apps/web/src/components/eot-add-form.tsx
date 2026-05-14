"use client";

import { useEffect, useState } from "react";

import { BSDatePicker } from "@pt/ui";

import { addEoTAction } from "@/lib/project/actions";

export function EoTAddForm({
  projectId,
  floorISO,
}: {
  projectId: string;
  /** AD ISO date (YYYY-MM-DD) that the new EoT must exceed. */
  floorISO: string;
}) {
  const [extendedTo, setExtendedTo] = useState<string>("");

  // The hidden input emitted by BSDatePicker has name "extendedToDate".
  // We watch the form on mount to mirror its value.
  useEffect(() => {
    const form = document.getElementById("eot-add-form") as HTMLFormElement | null;
    if (!form) return;
    const handler = () => {
      const input = form.querySelector<HTMLInputElement>('input[name="extendedToDate"]');
      setExtendedTo(input?.value ?? "");
    };
    form.addEventListener("change", handler);
    return () => form.removeEventListener("change", handler);
  }, []);

  const days = (() => {
    if (!extendedTo || !floorISO) return null;
    const a = new Date(extendedTo).getTime();
    const b = new Date(floorISO).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    const d = Math.round((a - b) / (1000 * 60 * 60 * 24));
    return d;
  })();

  return (
    <form
      id="eot-add-form"
      action={addEoTAction}
      className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <h3 className="text-base font-semibold">Add Extension of Time</h3>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-white/70">Extended to date (BS)</span>
        <BSDatePicker name="extendedToDate" required />
        {days !== null && (
          <span
            className={
              days > 0
                ? "text-xs text-emerald-300"
                : "text-xs text-red-300"
            }
          >
            {days > 0
              ? `+${days} days from the previous date`
              : `Must be later than the previous date (currently ${days} day${days === -1 ? "" : "s"} off)`}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-white/70">Approval date (BS)</span>
        <BSDatePicker name="approvalDate" required />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-white/70">Reason</span>
        <textarea
          name="reason"
          required
          rows={3}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
        />
      </label>

      <button
        type="submit"
        className="self-start rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
      >
        Add EoT
      </button>
    </form>
  );
}
