"use client";

import { BSDatePicker } from "@pt/ui";

import { MoneyInput } from "./money-input";
import { addVOAction } from "@/lib/project/actions";

export function VOAddForm({ projectId }: { projectId: string }) {
  return (
    <form
      action={addVOAction}
      className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <h3 className="text-base font-semibold">Add Variation Order</h3>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-white/70">Revised contract amount</span>
        <MoneyInput name="revisedContractAmount" required />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-white/70">Approval date (BS)</span>
        <BSDatePicker name="approvalDate" required />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-white/70">Description</span>
        <textarea
          name="description"
          required
          rows={3}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
        />
      </label>

      <button
        type="submit"
        className="self-start rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
      >
        Add VO
      </button>
    </form>
  );
}
