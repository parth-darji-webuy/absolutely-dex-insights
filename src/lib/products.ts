import { sum } from "./rng";
import type { Product } from "@/types";

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
