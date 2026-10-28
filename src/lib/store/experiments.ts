import "server-only";
import { setupFor, type MetricTable } from "@/config/experiments";
import type { Experiment, RecentWindow } from "@/types";
import { runQuery, type Tx } from "../db";
import { getEnv } from "../env";
import { daysFromTo, localDay, shiftDay, startLabel } from "../tz";
import { buildExperiment, type Counts } from "./build-experiment";
import { getGrowthBook } from "./growthbook";

const num = (v: bigint | number | null | undefined) => Number(v ?? 0);

type ExposureRow = { key: string; vid: number; vname: string | null; vvalue: string | null; flag: string | null; ename: string | null; day: string; people: bigint };
type ConvRow = { key: string; vid: number; day: string; converted: bigint };

const exposureRows = (tx: Tx, tz: string) =>
  tx.$queryRaw<ExposureRow[]>`
    SELECT "experimentKey" AS key, "variationId" AS vid, MAX("variationName") AS vname, MAX("variationValue") AS vvalue,
           MAX("featureId") AS flag, MAX("experimentName") AS ename,
           ((("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text AS day,
           COUNT(*) AS people
    FROM experiment_tracking
    GROUP BY 1, 2, 7`;

// One query per tracking table, so every table name is written out in full.
const conversionRows = (tx: Tx, table: MetricTable, keys: string[], tz: string): Promise<ConvRow[]> => {
  if (keys.length === 0) return Promise.resolve([]);
  if (table === "add_to_cart_tracking")
    return tx.$queryRaw<ConvRow[]>`
      SELECT e."experimentKey" AS key, e."variationId" AS vid,
             (((e."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text AS day, COUNT(*) AS converted
      FROM experiment_tracking e
      WHERE e."experimentKey" = ANY(${keys}::text[])
        AND EXISTS (SELECT 1 FROM add_to_cart_tracking m WHERE m."anonymousId" = e."anonymousId" AND m."createdAt" >= e."createdAt")
      GROUP BY 1, 2, 3`;
  if (table === "whats_new_tracking")
    return tx.$queryRaw<ConvRow[]>`
      SELECT e."experimentKey" AS key, e."variationId" AS vid,
             (((e."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text AS day, COUNT(*) AS converted
      FROM experiment_tracking e
      WHERE e."experimentKey" = ANY(${keys}::text[])
        AND EXISTS (SELECT 1 FROM whats_new_tracking m WHERE m."anonymousId" = e."anonymousId" AND m."experimentKey" = e."experimentKey" AND m."createdAt" >= e."createdAt")
      GROUP BY 1, 2, 3`;
  return tx.$queryRaw<ConvRow[]>`
    SELECT e."experimentKey" AS key, e."variationId" AS vid,
           (((e."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text AS day, COUNT(*) AS converted
    FROM experiment_tracking e
    WHERE e."experimentKey" = ANY(${keys}::text[])
      AND EXISTS (SELECT 1 FROM theme_toggle_tracking m WHERE m."anonymousId" = e."anonymousId" AND m."createdAt" >= e."createdAt")
    GROUP BY 1, 2, 3`;
};

/** Daily people and conversions for one experiment, per variant, from the rows above. */
function countsFor(key: string, exposures: ExposureRow[], conversions: ConvRow[]): Counts {
  const out: Counts = { people: { 0: {}, 1: {} }, converted: { 0: {}, 1: {} } };
  for (const r of exposures) if (r.key === key && (r.vid === 0 || r.vid === 1)) out.people[r.vid][r.day] = num(r.people);
  for (const r of conversions) if (r.key === key && (r.vid === 0 || r.vid === 1)) out.converted[r.vid][r.day] = num(r.converted);
  return out;
}

const TABLES: MetricTable[] = ["add_to_cart_tracking", "whats_new_tracking", "theme_toggle_tracking"];

/** Every experiment the store has recorded, with GrowthBook's names and status when it can be reached. */
export function loadExperiments(now?: Date): Promise<Experiment[]> {
  if (now) return computeExperiments(now);
  // Several cards on one page ask for the experiments at once: share one answer for a few seconds.
  if (!memo || Date.now() - memo.at > 10_000) {
    const promise = computeExperiments(new Date());
    memo = { at: Date.now(), promise };
    promise.catch(() => memo?.promise === promise && (memo = undefined));
  }
  return memo.promise;
}

let memo: { at: number; promise: Promise<Experiment[]> } | undefined;

async function computeExperiments(now: Date): Promise<Experiment[]> {
  const { INSIGHTS_TIMEZONE: tz } = getEnv();
  const [gb, { exposures, conversions }] = await Promise.all([
    getGrowthBook(),
    runQuery(async (tx) => {
      const exposures = await exposureRows(tx, tz);
      const keys = [...new Set(exposures.map((r) => r.key))];
      const byTable = TABLES.map((t) => [t, keys.filter((k) => setupFor(k).metricTable === t)] as const);
      const conversions = (await Promise.all(byTable.map(([t, ks]) => conversionRows(tx, t, ks, tz)))).flat();
      return { exposures, conversions };
    }),
  ]);
  const today = localDay(now, tz);
  // Everything the store has recorded, plus tests GrowthBook is running that nobody has entered yet.
  const keys = [...new Set([...exposures.map((r) => r.key), ...(gb?.experiments.map((x) => x.key) ?? [])])];
  const list = keys.map((key) => {
    const rows = exposures.filter((r) => r.key === key);
    const pick = (vid: number) => rows.find((r) => r.vid === vid);
    const g = gb?.experiments.find((x) => x.key === key);
    const days = rows.map((r) => r.day).sort();
    const first = days[0] ?? today;
    const last = days.at(-1) ?? today;
    const running = gb ? !!g : last >= shiftDay(today, -7);
    const info = (vid: 0 | 1) => ({
      label: pick(vid)?.vname || g?.names[vid] || (vid === 0 ? "Control" : "Treatment"),
      value: pick(vid)?.vvalue ?? g?.values[vid] ?? "",
    });
    return buildExperiment({
      key,
      flag: rows.find((r) => r.flag)?.flag ?? g?.flag ?? key,
      name: rows.find((r) => r.ename)?.ename ?? g?.name ?? key,
      control: info(0),
      treatment: info(1),
      status: running ? "Running" : "Stopped",
      days: daysFromTo(first, today),
      start: startLabel(first),
      counts: countsFor(key, exposures, conversions),
    });
  });
  return list.sort((a, b) => Number(b.status === "Running") - Number(a.status === "Running") || b.people - a.people || a.name.localeCompare(b.name));
}

export type RecentBase = Record<string, RecentWindow>;

/** The last `minutes` minutes for each experiment: [people, conversions] per variant and people per minute. */
export async function loadRecent(keys: string[], minutes: number, now: Date = new Date()): Promise<RecentBase> {
  const since = new Date(now.getTime() - minutes * 60_000);
  const out: RecentBase = Object.fromEntries(keys.map((k) => [k, { c: [0, 0], t: [0, 0], mins: Array<number>(minutes).fill(0) }]));
  if (keys.length === 0) return out;
  type Row = { key: string; vid: number; ago: number; people: bigint };
  type Conv = { key: string; vid: number; converted: bigint };
  const { rows, conv } = await runQuery(async (tx) => {
    const rows = await tx.$queryRaw<Row[]>`
      SELECT "experimentKey" AS key, "variationId" AS vid,
             FLOOR(EXTRACT(EPOCH FROM (${now}::timestamp - "createdAt")) / 60)::int AS ago, COUNT(*) AS people
      FROM experiment_tracking
      WHERE "createdAt" >= ${since} AND "createdAt" <= ${now}
      GROUP BY 1, 2, 3`;
    const conv: Conv[] = [];
    for (const table of TABLES) {
      const ks = keys.filter((k) => setupFor(k).metricTable === table);
      if (ks.length === 0) continue;
      if (table === "add_to_cart_tracking")
        conv.push(...(await tx.$queryRaw<Conv[]>`
          SELECT e."experimentKey" AS key, e."variationId" AS vid, COUNT(*) AS converted FROM experiment_tracking e
          WHERE e."createdAt" >= ${since} AND e."experimentKey" = ANY(${ks}::text[])
            AND EXISTS (SELECT 1 FROM add_to_cart_tracking m WHERE m."anonymousId" = e."anonymousId" AND m."createdAt" >= e."createdAt")
          GROUP BY 1, 2`));
      else if (table === "whats_new_tracking")
        conv.push(...(await tx.$queryRaw<Conv[]>`
          SELECT e."experimentKey" AS key, e."variationId" AS vid, COUNT(*) AS converted FROM experiment_tracking e
          WHERE e."createdAt" >= ${since} AND e."experimentKey" = ANY(${ks}::text[])
            AND EXISTS (SELECT 1 FROM whats_new_tracking m WHERE m."anonymousId" = e."anonymousId" AND m."experimentKey" = e."experimentKey" AND m."createdAt" >= e."createdAt")
          GROUP BY 1, 2`));
      else
        conv.push(...(await tx.$queryRaw<Conv[]>`
          SELECT e."experimentKey" AS key, e."variationId" AS vid, COUNT(*) AS converted FROM experiment_tracking e
          WHERE e."createdAt" >= ${since} AND e."experimentKey" = ANY(${ks}::text[])
            AND EXISTS (SELECT 1 FROM theme_toggle_tracking m WHERE m."anonymousId" = e."anonymousId" AND m."createdAt" >= e."createdAt")
          GROUP BY 1, 2`));
    }
    return { rows, conv };
  });
  for (const r of rows) {
    const w = out[r.key];
    if (!w || (r.vid !== 0 && r.vid !== 1)) continue;
    (r.vid === 0 ? w.c : w.t)[0] += num(r.people);
    const slot = minutes - 1 - Math.min(Math.max(r.ago, 0), minutes - 1);
    w.mins[slot] += num(r.people);
  }
  for (const r of conv) {
    const w = out[r.key];
    if (w && (r.vid === 0 || r.vid === 1)) (r.vid === 0 ? w.c : w.t)[1] += num(r.converted);
  }
  return out;
}

/** Exact daily people and conversions for one experiment, for the CSV reports. */
export async function loadDailyCounts(key: string): Promise<Counts> {
  const { INSIGHTS_TIMEZONE: tz } = getEnv();
  const table = setupFor(key).metricTable;
  const { exposures, conversions } = await runQuery(async (tx) => ({ exposures: await exposureRows(tx, tz), conversions: await conversionRows(tx, table, [key], tz) }));
  return countsFor(key, exposures, conversions);
}
