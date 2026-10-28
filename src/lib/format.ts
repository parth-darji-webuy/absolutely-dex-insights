/** 12480 -> "12,480". Anything that isn't a number shows 0, never NaN. */
export const fmt = (n: number): string => {
  const v = Math.round(n);
  return Number.isFinite(v) ? (v || 0).toLocaleString("en-US") : "0";
};

/** 12.04 -> "12.0%". Nothing to divide by (NaN, Infinity) shows "—". */
export const pct = (n: number, d = 1): string => (Number.isFinite(n) ? n.toFixed(d) + "%" : "—");

/** "5s ago", "12m ago", "3h ago", "8d ago". `now` is only for tests. */
export function ago(ts: number, now: number = Date.now()): string {
  const s = Math.max(1, Math.round((now - ts) / 1000));
  if (!Number.isFinite(s)) return "—";
  if (s < 60) return s + "s ago";
  const m = Math.round(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  return h < 48 ? h + "h ago" : Math.round(h / 24) + "d ago";
}

/** 24-hour clock, e.g. "14:03:09". */
export const clock = (ts: number): string =>
  Number.isFinite(ts) ? new Date(ts).toLocaleTimeString("en-GB", { hour12: false }) : "—";
