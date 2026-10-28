/** Maths shared by the charts. Pure, so it is tested without a browser. */

/** Any number that isn't finite counts as 0, so a bad value never reaches the SVG. */
export const safe = (n: number | null | undefined): number => (typeof n === "number" && Number.isFinite(n) ? n : 0);

export const sumOf = (a: number[]): number => a.reduce((x, y) => x + safe(y), 0);

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Rounds an axis maximum up to 1, 2, 2.5, 5 or 10 times a power of ten. Zero or less gives 1. */
export function niceMax(v: number): number {
  if (!(v > 0) || !Number.isFinite(v)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

/** "M1.0,2.0L3.0,4.0" for a list of points. */
export const linePath = (pts: [number, number][]): string =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");

/** x position of point i of n across [from, to]; a single point sits at the start. */
export const spreadX = (i: number, n: number, from: number, to: number): number => (n > 1 ? from + (i * (to - from)) / (n - 1) : from);

/** y position for value v between lo and hi; a flat range sits at the bottom. */
export const scaleY = (v: number, lo: number, hi: number, top: number, bottom: number): number =>
  hi === lo ? bottom : bottom - (bottom - top) * ((v - lo) / (hi - lo));

/** Which point is nearest to an x position (in chart units). */
export function nearestIndex(px: number, n: number, pl: number, pr: number, W: number, band?: number): number {
  if (n <= 1) return 0;
  const i = band ? Math.floor((px - pl) / band) : Math.round((px - pl) / ((W - pl - pr) / (n - 1)));
  return clamp(i, 0, n - 1);
}
