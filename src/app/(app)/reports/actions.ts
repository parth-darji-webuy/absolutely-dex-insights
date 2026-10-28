"use server";

import { getReportRows } from "@/lib/data";
import { parseYMD } from "@/lib/dates";
import { getEnv } from "@/lib/env";
import { checkPeriod, KEY_MAX } from "@/lib/report-period";
import { assertSignedIn } from "@/lib/session";
import { localDay } from "@/lib/tz";
import type { ReportRow } from "@/types";

export type PeriodSummary = { days: number; rows: number; people: number };

/** Daily rows for one experiment. Empty for a period that isn't a real date range. */
async function rowsFor(key: string, from: string, to: string): Promise<ReportRow[]> {
  const f = parseYMD(from);
  const t = parseYMD(to);
  if (!f || !t) return [];
  return getReportRows(key, f, t);
}

/** How much data the period holds for each experiment: days, rows and people. */
export async function periodSummary(keys: string[], from: string, to: string): Promise<Record<string, PeriodSummary>> {
  await assertSignedIn();
  const env = getEnv();
  // The same period rules as the download route: an impossible or huge period reads nothing.
  if (!checkPeriod(from, to, { today: localDay(new Date(), env.INSIGHTS_TIMEZONE), trackingStart: env.TRACKING_START }).ok) return {};
  if (!Array.isArray(keys) || keys.length > 50 || keys.some((k) => typeof k !== "string" || k.length > KEY_MAX)) return {};
  const entries = await Promise.all(
    keys.map(async (key) => {
      const rows = await rowsFor(key, from, to);
      return [key, { days: new Set(rows.map((r) => r.date)).size, rows: rows.length, people: rows.reduce((n, r) => n + r.people, 0) }] as const;
    }),
  );
  return Object.fromEntries(entries);
}
