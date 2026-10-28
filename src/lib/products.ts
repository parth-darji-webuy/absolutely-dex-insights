import { pct } from "./format";
import { sum } from "./rng";
import type { Product, QuickViewStats } from "@/types";

/** Products with more views than this count as "busy" on the Interest vs conversion chart. */
export const BUSY_VIEWS = 2700;

/** cool -> hot: blue at low values through violet to magenta. Not red: red means "problem". */
export const heat = (t: number): string => {
  const k = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
  return `hsl(${215 + k * 90} 70% ${55 + k * 5}% / ${(0.08 + k * 0.55).toFixed(2)})`;
};

/** Add-to-carts as a share of views, in %. NaN when there are no views (shown as "—"). */
export const addRate = (p: Pick<Product, "views" | "atc">): number => (p.views > 0 ? (p.atc / p.views) * 100 : NaN);

/** Share of all views that ended in an add to cart, in %. NaN when nothing was viewed. */
export function overallRate(products: Product[]): number {
  const views = sum(products.map((p) => p.views));
  return views > 0 ? (sum(products.map((p) => p.atc)) / views) * 100 : NaN;
}

/** Viewed a lot, but added to cart less often than average. */
export function coldProducts(products: Product[]): Product[] {
  const avg = overallRate(products);
  return products.filter((p) => p.views > BUSY_VIEWS && addRate(p) < avg);
}

/** Share of the people who opened quick view, in %. NaN when nobody did. */
export const ofOpened = (qv: QuickViewStats, n: number): number => (qv.opened > 0 ? (n / qv.opened) * 100 : NaN);

/** The sentence under the quick view modal. */
export function quickViewInsight(qv: QuickViewStats): string {
  if (!(qv.opened > 0)) return "Nobody has opened quick view yet this week.";
  if (!qv.extrasTracked) return `${pct(ofOpened(qv, qv.add), 0)} of the people who opened quick view added to cart. Product detail, wishlist and close clicks aren’t tracked yet.`;
  const closed = ofOpened(qv, qv.closed);
  const acts = [
    ["Add to Cart", qv.add],
    ["Product Detail", qv.detail],
    ["Wishlist", qv.wish],
  ] as const;
  const [top, next] = [...acts].sort((a, b) => b[1] - a[1]);
  const lead = closed > 50 ? `More than half of people (${pct(closed, 0)}) close` : `${pct(closed, 0)} of people close`;
  if (!(top[1] > 0)) return `${lead} quick view without acting.`;
  const tail = next[1] > 0 ? `, just ahead of ${next[0]} at ${pct(ofOpened(qv, next[1]), 0)}` : "";
  return `${lead} quick view without acting. ${top[0]} is the most-used action at ${pct(ofOpened(qv, top[1]), 0)}${tail}.`;
}
