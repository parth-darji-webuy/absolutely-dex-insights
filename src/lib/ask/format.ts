import type { Answer } from "@/types";

/** Columns that hold a visitor's id. */
const ID_COLUMN = /anonymous|visitor|customer/i;

/** "kT9xQ2mLpA4w" -> "kT9x…" so a visitor can't be recognised from what leaves this server. */
export const shortenId = (v: string): string => (v.length > 5 ? `${v.slice(0, 4)}…` : v);

const isDecimal = (v: unknown): v is { toNumber(): number } => typeof v === "object" && v !== null && typeof (v as { toNumber?: unknown }).toNumber === "function";

/** A database value as plain JSON: numbers for numbers (including COUNT and money), text for dates. */
export function plain(v: unknown): string | number | boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "bigint") return Number(v);
  if (isDecimal(v)) return v.toNumber();
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v.toISOString() : null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" || typeof v === "boolean") return v;
  return JSON.stringify(v);
}

export type Row = Record<string, unknown>;

/** The rows as they are sent to the AI: visitor ids shortened, at most `max` rows. */
export function rowsForAi(columns: string[], rows: Row[], max = 50): Record<string, string | number | boolean | null>[] {
  return rows.slice(0, max).map((r) =>
    Object.fromEntries(
      columns.map((c) => {
        const v = plain(r[c]);
        return [c, ID_COLUMN.test(c) && typeof v === "string" ? shortenId(v) : v];
      }),
    ),
  );
}

const show = (v: string | number | boolean | null): string => (v === null ? "—" : typeof v === "number" ? (Number.isInteger(v) ? v.toLocaleString("en-US") : String(Math.round(v * 100) / 100)) : String(v));

/** Column names, rows as text, and bars when the result is a label with a number (at most 12 rows). */
export function answerParts(columns: string[], rows: Row[]): Pick<Answer, "cols" | "rows" | "bars" | "unit"> {
  const cells = rows.map((r) => columns.map((c) => plain(r[c])));
  const numeric = columns.map((_, i) => cells.length > 0 && cells.every((r) => r[i] === null || typeof r[i] === "number"));
  const valueAt = numeric.findIndex((n, i) => n && (columns.length === 1 || i > 0 || !numeric.every(Boolean)));
  const labelAt = columns.findIndex((_, i) => !numeric[i]);
  const useLabel = labelAt >= 0 ? labelAt : 0;
  const value = valueAt >= 0 && valueAt !== useLabel ? valueAt : numeric.findIndex((n, i) => n && i !== useLabel);
  let bars: [string, number][] = [];
  if (value >= 0 && columns.length >= 2 && rows.length >= 1 && rows.length <= 12) {
    bars = cells.map((r) => [show(r[useLabel]), Number(r[value] ?? 0)] as [string, number]).filter(([, n]) => Number.isFinite(n));
  }
  const unit = value >= 0 && /pct|percent|rate/i.test(columns[value]) ? "%" : undefined;
  return { cols: columns, rows: cells.map((r) => r.map(show)), bars, unit };
}
