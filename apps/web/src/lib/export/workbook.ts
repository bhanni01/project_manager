import ExcelJS from "exceljs";

// Indian/Nepali digit grouping. Whole rupees.
export const NEPALI_CURRENCY = '"Rs. "#,##,##0';
export const NEPALI_CURRENCY_2DP = '"Rs. "#,##,##0.00';
// Literal "%" so we can write raw values from @pt/calc (which already returns
// percentage units, not fractions) without dividing by 100.
export const PERCENT = '0.00"%"';
export const SHORT_DATE = "yyyy-mm-dd";

const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F2937" }, // slate-800
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
};

export function styleHeaderRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
  row.height = 22;
}

export function freezePanes(sheet: ExcelJS.Worksheet, ySplit = 1): void {
  sheet.views = [{ state: "frozen", ySplit }];
}

export type ColorScaleKind = "spend" | "surplus";

/**
 * 3-color scale (red → amber → green) on a worksheet range.
 *   - "spend"   : green low → red high (good when low, bad when high)
 *   - "surplus" : red low → green high (negative bad, positive good)
 */
export function applyColorScale(
  sheet: ExcelJS.Worksheet,
  range: string,
  kind: ColorScaleKind,
): void {
  const lowColor = kind === "spend" ? "FF22C55E" : "FFEF4444";  // green / red
  const midColor = "FFF59E0B";                                  // amber
  const highColor = kind === "spend" ? "FFEF4444" : "FF22C55E"; // red / green

  sheet.addConditionalFormatting({
    ref: range,
    rules: [
      {
        type: "colorScale",
        priority: 1,
        cfvo: [
          { type: "min" },
          { type: "percentile", value: 50 },
          { type: "max" },
        ],
        color: [
          { argb: lowColor },
          { argb: midColor },
          { argb: highColor },
        ],
      },
    ],
  });
}

export function reportFilename(name: string, fyLabel: string, today: Date): string {
  const ad = today.toISOString().slice(0, 10);
  const fy = fyLabel.replace("/", "-");
  return `${name}_${fy}_${ad}.xlsx`;
}

export async function writeWorkbookResponse(
  wb: ExcelJS.Workbook,
  filename: string,
): Promise<Response> {
  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Add a sheet, set the columns (key + header + width + style), apply header
 * styling and freeze the first row in one call. */
export function makeSheet(
  wb: ExcelJS.Workbook,
  name: string,
  columns: Array<{
    key: string;
    header: string;
    width?: number;
    numFmt?: string;
  }>,
): ExcelJS.Worksheet {
  const sheet = wb.addWorksheet(name);
  sheet.columns = columns.map((c) => ({
    key: c.key,
    header: c.header,
    width: c.width ?? 18,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  }));
  styleHeaderRow(sheet.getRow(1));
  freezePanes(sheet, 1);
  return sheet;
}

/** Convenience: convert a decimal-ish value to a JS number suitable for the
 *  Excel cell. Falls back to 0 for null/undefined/empty. */
export function asNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  const n = Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}
