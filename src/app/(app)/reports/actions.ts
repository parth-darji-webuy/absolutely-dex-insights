"use server";

import { getReportRows } from "@/lib/data";
import { parseYMD } from "@/lib/dates";
import { assertSignedIn } from "@/lib/session";
import type { ReportRow } from "@/types";

export type PeriodSummary = { days: number; rows: number; people: number };

/** Daily rows for one experiment, for the CSV. Empty for a period that isn't a real date range. */
export async function reportRowsFor(key: string, from: string, to: string): Promise<ReportRow[]> {
  await assertSignedIn();
  const f = parseYMD(from);
  const t = parseYMD(to);
  if (!f || !t) return [];
  return getReportRows(key, f, t);
}

/** How much data the period holds for each experiment: days, rows and people. */
export async function periodSummary(keys: string[], from: string, to: string): Promise<Record<string, PeriodSummary>> {
  await assertSignedIn();
  const entries = await Promise.all(
    keys.map(async (key) => {
      const rows = await reportRowsFor(key, from, to);
      return [key, { days: new Set(rows.map((r) => r.date)).size, rows: rows.length, people: rows.reduce((n, r) => n + r.people, 0) }] as const;
    }),
  );
  return Object.fromEntries(entries);
}
