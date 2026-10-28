import { parseYMD, rangeError } from "./dates";

export const KEY_MAX = 64;

export type PeriodContext = {
  /** Today in the store's time zone, "YYYY-MM-DD". */
  today: string;
  /** TRACKING_START, "YYYY-MM-DD". */
  trackingStart: string;
};

export type PeriodCheck = { ok: true; from: Date; to: Date; fromKey: string; toKey: string } | { ok: false; message: string };

/**
 * Checks a report period with the same rules, and the same words, as the Reports page: real YYYY-MM-DD dates,
 * From on or after TRACKING_START, To no later than today, From not after To, and at most 366 days.
 */
export function checkPeriod(from: string | null | undefined, to: string | null | undefined, ctx: PeriodContext): PeriodCheck {
  const f = parseYMD(from);
  const t = parseYMD(to);
  const today = parseYMD(ctx.today);
  const start = parseYMD(ctx.trackingStart);
  if (!today || !start) return { ok: false, message: "The report dates aren’t set up. Check TRACKING_START." };
  const message = rangeError(f, t, today, start);
  return message || !f || !t ? { ok: false, message: message || "Choose both a From and a To date." } : { ok: true, from: f, to: t, fromKey: from as string, toKey: to as string };
}

export type ReportQuery = { ok: true; key: string; from: Date; to: Date; fromKey: string; toKey: string } | { ok: false; message: string };

/** Checks ?key=&from=&to= for the report route. */
export function parseReportQuery(params: URLSearchParams, ctx: PeriodContext): ReportQuery {
  const key = params.get("key");
  if (!key) return { ok: false, message: "key is required." };
  if (key.length > KEY_MAX) return { ok: false, message: `key can be at most ${KEY_MAX} characters.` };
  const period = checkPeriod(params.get("from"), params.get("to"), ctx);
  return period.ok ? { ...period, key } : period;
}
