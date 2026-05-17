import Link from "next/link";

import { BSDatePicker } from "@pt/ui";

import { requireRole } from "@/lib/auth/guards";
import { previewRolloverAction } from "@/lib/fiscal-year/actions";

export default async function NewFiscalYearPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole("PROJECT_MANAGER");
  const { error } = await props.searchParams;

  const errorMessage =
    error === "label_format"
      ? "Label must look like 2083/84 (NNNN/NN)."
      : error === "label_taken"
        ? "That fiscal year label already exists."
        : error === "dates_invalid"
          ? "Start date must be before end date."
          : error === "no_current_fy"
            ? "There is no active fiscal year to close."
            : error
              ? "Something went wrong."
              : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <nav className="text-sm text-white/60">
        <Link className="hover:text-white" href="/fiscal-year">
          ← Fiscal years
        </Link>
      </nav>

      <header>
        <p className="text-sm uppercase tracking-wider text-white/40">Close &amp; open next FY</p>
        <h1 className="mt-1 text-3xl font-semibold">Open next fiscal year</h1>
        <p className="mt-1 text-sm text-white/60">
          You&apos;ll see a dry-run preview before any data is changed.
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

      <form
        action={previewRolloverAction}
        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/70">Next FY label</span>
          <input
            type="text"
            name="nextLabel"
            required
            placeholder="e.g. 2083/84"
            pattern="\d{4}/\d{2}"
            title="Format: NNNN/NN"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/70">Start date (BS)</span>
          <BSDatePicker name="startDate" required />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/70">End date (BS)</span>
          <BSDatePicker name="endDate" required />
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Preview rollover
          </button>
          <Link
            href="/fiscal-year"
            className="text-sm text-white/60 hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
