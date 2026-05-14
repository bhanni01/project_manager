"use client";

import { useEffect, useMemo, useState } from "react";
import NepaliDate from "nepali-date-converter";

const MONTHS = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

const DEFAULT_MIN_YEAR = 2070;
const DEFAULT_MAX_YEAR = 2099;

function adToBSParts(ad: Date | undefined | null): {
  year: number;
  month: number;
  day: number;
} | null {
  if (!ad) return null;
  const nd = new NepaliDate(ad);
  return { year: nd.getYear(), month: nd.getMonth() + 1, day: nd.getDate() };
}

function partsToAD(year: number, month: number, day: number): Date {
  const nd = new NepaliDate(year, month - 1, day);
  return nd.toJsDate();
}

function todayBS(): { year: number; month: number; day: number } {
  const nd = new NepaliDate(new Date());
  return { year: nd.getYear(), month: nd.getMonth() + 1, day: nd.getDate() };
}

export interface BSDatePickerProps {
  /** Submitted hidden input name; value is AD ISO YYYY-MM-DD. */
  name: string;
  /** Initial AD date (uncontrolled internally; the picker updates from this once). */
  defaultValue?: Date | string | null;
  /** Whether the field is required (adds required attribute on hidden input). */
  required?: boolean;
  minYear?: number;
  maxYear?: number;
  className?: string;
  id?: string;
}

/**
 * Three-select BS date picker. Hidden <input name=...> emits AD ISO YYYY-MM-DD
 * so form submission works without JS state in the parent.
 *
 * Pragmatic v1 — a popover + calendar grid lands in the UI polish step.
 */
export function BSDatePicker({
  name,
  defaultValue,
  required,
  minYear = DEFAULT_MIN_YEAR,
  maxYear = DEFAULT_MAX_YEAR,
  className,
  id,
}: BSDatePickerProps) {
  const initial = useMemo(() => {
    if (!defaultValue) return null;
    const ad = typeof defaultValue === "string" ? new Date(defaultValue) : defaultValue;
    if (Number.isNaN(ad.getTime())) return null;
    return adToBSParts(ad);
  }, [defaultValue]);

  const [year, setYear] = useState<number | "">(initial?.year ?? "");
  const [month, setMonth] = useState<number | "">(initial?.month ?? "");
  const [day, setDay] = useState<number | "">(initial?.day ?? "");

  // Recompute hidden AD ISO whenever all three are set.
  const adISO = useMemo(() => {
    if (year === "" || month === "" || day === "") return "";
    try {
      const ad = partsToAD(Number(year), Number(month), Number(day));
      const y = ad.getFullYear();
      const m = (ad.getMonth() + 1).toString().padStart(2, "0");
      const d = ad.getDate().toString().padStart(2, "0");
      return `${y}-${m}-${d}`;
    } catch {
      return "";
    }
  }, [year, month, day]);

  // If the BS day is out of range for the picked month (e.g. 32 for a 30-day
  // month), clamp it once when month/year change.
  useEffect(() => {
    if (year === "" || month === "" || day === "") return;
    try {
      const nd = partsToAD(Number(year), Number(month), Number(day));
      const back = new NepaliDate(nd);
      if (back.getMonth() + 1 !== Number(month)) {
        // Day overflowed; clamp down.
        for (let candidate = Number(day) - 1; candidate >= 1; candidate--) {
          try {
            const ad = partsToAD(Number(year), Number(month), candidate);
            const bk = new NepaliDate(ad);
            if (bk.getMonth() + 1 === Number(month)) {
              setDay(candidate);
              return;
            }
          } catch {
            /* keep trying */
          }
        }
      }
    } catch {
      /* invalid — ignore */
    }
  }, [year, month, day]);

  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = minYear; y <= maxYear; y++) out.push(y);
    return out;
  }, [minYear, maxYear]);

  const setToday = (): void => {
    const t = todayBS();
    setYear(t.year);
    setMonth(t.month);
    setDay(t.day);
  };

  const selectClass =
    "rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm outline-none focus:border-white/30";

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      <select
        aria-label="BS year"
        id={id}
        value={year}
        onChange={(e) => setYear(e.target.value === "" ? "" : Number(e.target.value))}
        className={selectClass}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        aria-label="BS month"
        value={month}
        onChange={(e) => setMonth(e.target.value === "" ? "" : Number(e.target.value))}
        className={selectClass}
      >
        <option value="">Month</option>
        {MONTHS.map((m, idx) => (
          <option key={m} value={idx + 1}>
            {idx + 1}. {m}
          </option>
        ))}
      </select>

      <select
        aria-label="BS day"
        value={day}
        onChange={(e) => setDay(e.target.value === "" ? "" : Number(e.target.value))}
        className={selectClass}
      >
        <option value="">Day</option>
        {Array.from({ length: 32 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={setToday}
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/70 hover:bg-white/10"
      >
        Today
      </button>

      <input type="hidden" name={name} value={adISO} required={required} />
      {adISO && (
        <span className="text-xs text-white/40">AD: {adISO}</span>
      )}
    </div>
  );
}
