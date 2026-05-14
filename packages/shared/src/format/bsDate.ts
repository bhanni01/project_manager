import NepaliDate from "nepali-date-converter";

const MONTH_NAMES = [
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

/** Convert an AD Date to its BS components { year, month (1-12), day }. */
export function adToBS(ad: Date): { year: number; month: number; day: number } {
  const nd = new NepaliDate(ad);
  return { year: nd.getYear(), month: nd.getMonth() + 1, day: nd.getDate() };
}

/** Convert BS { year, month (1-12), day } back to an AD Date. */
export function bsToAD(year: number, month: number, day: number): Date {
  const nd = new NepaliDate(year, month - 1, day);
  return nd.toJsDate();
}

/**
 * Format an AD Date as BS.
 *   "short" → "2082/04/01"
 *   "long"  → "2082 Shrawan 1"
 */
export function formatBSDate(
  ad: Date | string | null | undefined,
  format: "short" | "long" = "short",
): string {
  if (!ad) return "";
  const d = ad instanceof Date ? ad : new Date(ad);
  const nd = new NepaliDate(d);
  const y = nd.getYear();
  const m = nd.getMonth() + 1;
  const day = nd.getDate();
  if (format === "long") {
    return `${y} ${MONTH_NAMES[m - 1]} ${day}`;
  }
  return `${y}/${m.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}`;
}

/**
 * Build the fiscal year label from a start date (BS year, "YY/(YY+1) % 100").
 *   AD 2025-07-16 (BS 2082/04/01) → "2082/83"
 */
export function formatFYLabel(startAD: Date | string): string {
  const d = startAD instanceof Date ? startAD : new Date(startAD);
  const nd = new NepaliDate(d);
  const startYear = nd.getYear();
  const endShort = (startYear + 1) % 100;
  return `${startYear}/${endShort.toString().padStart(2, "0")}`;
}

export const BS_MONTH_NAMES = MONTH_NAMES;
