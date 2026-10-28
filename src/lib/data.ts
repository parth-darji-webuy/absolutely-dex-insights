// The only place pages get data from. Everything here reads the store's database through
// src/lib/store/*, read-only. Names and types are the ones the pages were built against.
import { connection } from "next/server";
import type { AnalyticsEvent, EventsPerMinute, Experiment, Overview, ProductsData, ReportRow, StoreLast30 } from "@/types";
import { loadEvents, loadEventsPerMinute } from "./store/events";
import { loadExperiments } from "./store/experiments";
import { loadOverview, loadStoreLast30 } from "./store/overview";
import { loadProducts } from "./store/products";
import { loadReportRows } from "./store/reports";

// The numbers depend on the clock and the database, so they are worked out for each visit,
// never while the app is being built.
const live = <A extends unknown[], R>(fn: (...args: A) => Promise<R>) => async (...args: A): Promise<R> => {
  await connection();
  return fn(...args);
};

export const getOverview = live((): Promise<Overview> => loadOverview());

export const getStoreLast30 = live((): Promise<StoreLast30> => loadStoreLast30());

export const getExperiments = live((): Promise<Experiment[]> => loadExperiments());

/** Resolves to null when there is no experiment with that key. */
export const getExperiment = live(async (key: string): Promise<Experiment | null> => (await loadExperiments()).find((e) => e.key === key) ?? null);

export const getEvents = live((): Promise<AnalyticsEvent[]> => loadEvents());

/** Events in each of the last 60 minutes, for the Events page chart. */
export const getEventsPerMinute = live((): Promise<EventsPerMinute> => loadEventsPerMinute());

export const getProducts = live((): Promise<ProductsData> => loadProducts());

/** Daily results for one experiment, two rows (control, treatment) per day. Empty for an unknown key or period. */
export const getReportRows = live((key: string, from: Date, to: Date): Promise<ReportRow[]> => loadReportRows(key, from, to));
