// The only place pages get data from. Until phase 6 these return the sample data after 400 ms;
// then they become real queries with the same names and types.
import { ATC, ATC_PREV, DAILY, DAYS, DEVICES, FLAG_COUNTS, RUNNING_COUNTS, SOURCES, EBY, EVT_META, EXPS, generateEvents, generateEventsPerMinute, PRODUCTS, CATS, COLOURS, QV, IDLE, RECENT, RECENT_MIN, RECENT_VISITORS, VIS, VIS_PREV, ZONES } from "@/mocks";
import type { AnalyticsEvent, EventsPerMinute, Experiment, Overview, ProductsData, ReportRow, StoreLast30 } from "@/types";
import { daysBetween, eachDay, expDay, WDAY, ymd } from "./dates";

const LATENCY_MS = 400;
const later = async <T>(make: () => T): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  return structuredClone(make());
};

export const getOverview = (): Promise<Overview> =>
  later(() => ({ days: DAYS, visitors: VIS, visitorsPrevWeek: VIS_PREV, addToCarts: ATC, addToCartsPrevWeek: ATC_PREV, flagCounts: FLAG_COUNTS, runningCounts: RUNNING_COUNTS, sources: SOURCES, devices: DEVICES, eventMeta: EVT_META, daily: DAILY }));

export const getStoreLast30 = (): Promise<StoreLast30> =>
  later(() => ({ minutes: RECENT_MIN, visitors: RECENT_VISITORS, zones: ZONES, idle: IDLE, recent: RECENT }));

export const getExperiments = (): Promise<Experiment[]> => later(() => EXPS);

/** Resolves to null when there is no experiment with that key. */
export const getExperiment = (key: string): Promise<Experiment | null> => later(() => EBY[key] ?? null);

export const getEvents = (): Promise<AnalyticsEvent[]> => later(() => generateEvents());

/** Events in each of the last 60 minutes, for the Events page chart. */
export const getEventsPerMinute = (): Promise<EventsPerMinute> => later(() => generateEventsPerMinute());

export const getProducts = (): Promise<ProductsData> => later(() => ({ products: PRODUCTS, cats: CATS, colours: COLOURS, qv: QV }));

/** Daily results for one experiment, two rows (control, treatment) per day. Empty for an unknown key or period. */
export const getReportRows = (key: string, from: Date, to: Date): Promise<ReportRow[]> =>
  later(() => {
    const e = EBY[key];
    if (!e || !(daysBetween(from, to) > 0)) return [];
    return eachDay(from, to).flatMap((d) => {
      const x = expDay(e, d);
      if (!x) return [];
      return (["c", "t"] as const).map((k): ReportRow => {
        const n = x[k];
        const converted = Math.round((n * (k === "c" ? e.rc : e.rt)) / 100);
        return {
          date: ymd(d),
          weekday: WDAY[d.getDay()],
          experiment: e.name,
          flag: e.flag,
          variant: k === "c" ? "control" : "treatment",
          label: e[k].label,
          people: n,
          converted,
          ratePct: (n ? (converted / n) * 100 : 0).toFixed(2),
          metric: e.metricShort,
        };
      });
    });
  });
