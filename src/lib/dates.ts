import { DAILY_SPLIT } from "@/mocks/split";
import type { DailySplit, Experiment } from "@/types";
import { rng, seedOf, sum } from "./rng";

const pad2 = (n: number) => String(n).padStart(2, "0");
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const ymd = (d: Date): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const hms = (d: Date): string => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
/** 21 Oct 2026 */
export const niceDate = (d: Date): string => `${pad2(d.getDate())} ${MON[d.getMonth()]} ${d.getFullYear()}`;

// ---------- Statement-style period: any day range, like a bank statement ----------
const DAY = 864e5;
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const todayStart = () => dayStart(new Date());

/** Longest period one download can cover. */
export const RANGE_MAX = 366;

/** Tracking began on 1 Sep 2026 (or 90 days ago, if that is earlier than today's window). */
export const trackStart = (today: Date) => {
  const t = new Date(2026, 8, 1);
  return t < today ? t : addDays(today, -90);
};

/** Days from a to b, counting both ends. */
export const daysBetween = (a: Date, b: Date): number => Math.round((dayStart(b).getTime() - dayStart(a).getTime()) / DAY) + 1;

export type PresetKey = "7d" | "30d" | "thisMonth" | "lastMonth";

export function presetRange(k: PresetKey, today: Date = todayStart()): [Date, Date] | null {
  const t = dayStart(today);
  if (k === "7d") return [addDays(t, -6), t];
  if (k === "30d") return [addDays(t, -29), t];
  if (k === "thisMonth") return [new Date(t.getFullYear(), t.getMonth(), 1), t];
  if (k === "lastMonth") return [new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0)];
  return null;
}

/** The message to show under the date pickers, or "" when the period is fine. */
export function rangeError(from: Date | null, to: Date | null, today: Date = todayStart()): string {
  const t = dayStart(today);
  if (!from || !to) return "Choose both a From and a To date.";
  if (from > to) return "The From date must be on or before the To date.";
  if (to > t) return "The To date can’t be in the future.";
  if (from < trackStart(t)) return `Data starts on ${niceDate(trackStart(t))}. Pick a later From date.`;
  if (daysBetween(from, to) > RANGE_MAX) return `A download covers at most ${RANGE_MAX} days. Shorten the period.`;
  return "";
}

export const eachDay = (from: Date, to: Date): Date[] =>
  Array.from({ length: Math.max(0, daysBetween(from, to)) }, (_, i) => addDays(from, i));

/** Splits `total` into `n` whole numbers that add up to `total`, with a gentle seeded wobble. */
export function splitTotal(total: number, n: number, seed: number): number[] {
  if (n <= 0) return [];
  const r = rng(seed);
  const w = Array.from({ length: n }, () => 0.8 + r() * 0.4);
  const ws = sum(w);
  const exact = w.map((x) => (total * x) / ws);
  const out = exact.map(Math.floor);
  exact
    .map((x, i) => [x - out[i], i] as const)
    .sort((a, b) => b[0] - a[0])
    .slice(0, total - sum(out))
    .forEach(([, i]) => out[i]++);
  return out;
}

/** People shown the test each day, per variant. */
export function dailyPeople(e: Experiment): DailySplit {
  if (DAILY_SPLIT[e.key]) return DAILY_SPLIT[e.key];
  const n = e.series.c.length;
  return { c: splitTotal(e.c.people, n, e.key.length), t: splitTotal(e.t.people, n, e.key.length + 3) };
}

/** Experiment people per variant on one day (from its own daily history, then a steady pace after that). */
export function expDay(e: Experiment, d: Date, today: Date = todayStart()): { c: number; t: number } | null {
  const start = dayStart(new Date(e.start));
  const i = Math.round((dayStart(d).getTime() - start.getTime()) / DAY);
  if (!Number.isFinite(i) || i < 0 || dayStart(d) > dayStart(today)) return null;
  const dp = dailyPeople(e);
  if (i < dp.c.length) return { c: dp.c[i], t: dp.t[i] };
  const r = rng(seedOf(e.key + ymd(d)));
  const avg = e.days ? e.people / e.days / 2 : 0;
  return { c: Math.round(avg * (0.85 + r() * 0.3)), t: Math.round(avg * (0.85 + r() * 0.3)) };
}

/** "2026-10-21" -> a local date, or null when it isn't a real YYYY-MM-DD date. */
export function parseYMD(s: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return ymd(d) === s ? d : null;
}

/** "Europe/London (UTC+01:00)" */
export function tzLabel(d: Date = new Date()): string {
  let name = "Local time";
  try {
    name = Intl.DateTimeFormat().resolvedOptions().timeZone || name;
  } catch {
    // keep the fallback
  }
  const off = -d.getTimezoneOffset();
  return `${name} (UTC${off >= 0 ? "+" : "−"}${pad2(Math.floor(Math.abs(off) / 60))}:${pad2(Math.abs(off) % 60)})`;
}
