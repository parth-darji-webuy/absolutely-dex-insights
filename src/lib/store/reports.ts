import "server-only";
import type { ReportRow } from "@/types";
import { daysBetween, ymd } from "../dates";
import { getEnv } from "../env";
import { daysFromTo, localDay, weekdayOf } from "../tz";
import { loadDailyCounts, loadExperiments } from "./experiments";

const WDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** One row per day and variant, from the day the test started to the end of the period. Empty for an unknown test or period. */
export async function loadReportRows(key: string, from: Date, to: Date, now: Date = new Date()): Promise<ReportRow[]> {
  if (!(daysBetween(from, to) > 0)) return [];
  const { INSIGHTS_TIMEZONE: tz } = getEnv();
  const [exps, counts] = await Promise.all([loadExperiments(now), loadDailyCounts(key)]);
  const e = exps.find((x) => x.key === key);
  if (!e) return [];
  const startKey = ymd(new Date(e.start));
  const today = localDay(now, tz);
  const [lo, hi] = [ymd(from) > startKey ? ymd(from) : startKey, ymd(to) < today ? ymd(to) : today];
  return daysFromTo(lo, hi).flatMap((day) =>
    (["c", "t"] as const).map((k): ReportRow => {
      const v = k === "c" ? 0 : 1;
      const people = counts.people[v][day] ?? 0;
      const converted = counts.converted[v][day] ?? 0;
      return {
        date: day,
        weekday: WDAY[weekdayOf(day)],
        experiment: e.name,
        flag: e.flag,
        variant: k === "c" ? "control" : "treatment",
        label: e[k].label,
        people,
        converted,
        ratePct: (people ? (converted / people) * 100 : 0).toFixed(2),
        metric: e.metricShort,
      };
    }),
  );
}
