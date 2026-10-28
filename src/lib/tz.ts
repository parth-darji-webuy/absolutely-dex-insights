// Days as the store's owner sees them: in INSIGHTS_TIMEZONE, as "YYYY-MM-DD" keys.
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The calendar day of `date` in time zone `tz`, e.g. "2026-10-21". */
export function localDay(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Moves a "YYYY-MM-DD" key by `n` days. */
export function shiftDay(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** The last `n` days ending today (oldest first). */
export function lastDays(n: number, tz: string, now: Date = new Date()): string[] {
  const today = localDay(now, tz);
  return Array.from({ length: n }, (_, i) => shiftDay(today, i - (n - 1)));
}

/** Every day from `from` to `to`, both included. */
export function daysFromTo(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 400; d = shiftDay(d, 1)) out.push(d);
  return out;
}

/** "2026-10-21" -> "Oct 21". */
export const dayLabel = (key: string): string => {
  const [, m, d] = key.split("-").map(Number);
  return `${MON[(m || 1) - 1]} ${d}`;
};

/** "2026-10-21" -> "Oct 21, 2026". */
export const startLabel = (key: string): string => `${dayLabel(key)}, ${key.slice(0, 4)}`;

/** Weekday of a "YYYY-MM-DD" key: 0 = Sunday. */
export const weekdayOf = (key: string): number => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/** "Asia/Kolkata (UTC+05:30)" for `date` in time zone `tz`. */
export function tzLabel(date: Date, tz: string): string {
  const raw = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(date).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const offset = raw === "GMT" ? "+00:00" : raw.replace("GMT", "").replace("−", "-");
  return `${tz} (UTC${offset})`;
}

/** "28 Oct 2026, 09:05:03" for `date` on the clock of time zone `tz`. */
export function stamp(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${g("day")} ${g("month")} ${g("year")}, ${g("hour")}:${g("minute")}:${g("second")}`;
}
