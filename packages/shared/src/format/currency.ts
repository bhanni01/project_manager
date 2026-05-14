import Decimal from "decimal.js";

/**
 * Format a money value with Indian/Nepali digit grouping and no decimals.
 *   1250000     → "Rs. 12,50,000"
 *   12500000    → "Rs. 1,25,00,000"
 *   0           → "Rs. 0"
 *   null/empty  → "Rs. 0"
 */
export function formatNepaliCurrency(value: Decimal | string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Rs. 0";
  const d = value instanceof Decimal ? value : new Decimal(value);
  const negative = d.isNegative();
  const whole = d.abs().toFixed(0);

  // Indian grouping: rightmost group of 3 digits, then groups of 2.
  let grouped: string;
  if (whole.length <= 3) {
    grouped = whole;
  } else {
    const last3 = whole.slice(-3);
    const rest = whole.slice(0, -3);
    const restGrouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    grouped = `${restGrouped},${last3}`;
  }
  return `Rs. ${negative ? "-" : ""}${grouped}`;
}

/** Format a percent value with two decimals (e.g. 30 → "30.00%"). */
export function formatPercent(value: Decimal | string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0.00%";
  const d = value instanceof Decimal ? value : new Decimal(value);
  return `${d.toFixed(2)}%`;
}
