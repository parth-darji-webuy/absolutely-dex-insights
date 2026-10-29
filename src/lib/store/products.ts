import "server-only";
import type { CategoryCount, ColourCount, Product, ProductsData, QuickViewStats } from "@/types";
import { swatchFor } from "../colour";
import { runQuery } from "../db";
import { getEnv } from "../env";
import { lastDays, shiftDay } from "../tz";

const num = (v: unknown) => Number(typeof v === "bigint" ? Number(v) : (v ?? 0));
const TOP = 5;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
const hueOf = (name: string) => [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
/** The store keeps sizes and colours as JSON text, e.g. '["S","M"]'. Anything else gives an empty list. */
export function jsonList(text: string | null): string[] {
  try {
    const v: unknown = JSON.parse(text ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

type ProductRow = { id: string; name: string; slug: string; brand: string; price: number; sizes: string | null; colors: string | null; cat: string; qv: bigint; atc: bigint; yday: bigint };

/** This week's quick views and add-to-carts per product, the category and colour shares, and the quick view numbers. */
export async function loadProducts(now: Date = new Date()): Promise<ProductsData> {
  const { INSIGHTS_TIMEZONE: tz } = getEnv();
  const week = lastDays(7, tz, now);
  const first = week[0];
  const yesterday = week[5];
  const since = new Date(Date.parse(`${shiftDay(first, -1)}T00:00:00Z`));

  const data = await runQuery(async (tx) => {
    const rows = await tx.$queryRaw<ProductRow[]>`
      SELECT p.id, p.name, p.slug, p.brand, p.price, p.sizes, p.colors, c.name AS cat,
        (SELECT COUNT(*) FROM quickview_tracking q WHERE q."productId" = p.id AND q."createdAt" >= ${since}
           AND (((q."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text >= ${first}) AS qv,
        (SELECT COUNT(*) FROM add_to_cart_tracking a WHERE a."productId" = p.id AND a."createdAt" >= ${since}
           AND (((a."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text >= ${first}) AS atc,
        (SELECT COUNT(*) FROM add_to_cart_tracking a WHERE a."productId" = p.id AND a."createdAt" >= ${since}
           AND (((a."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text = ${yesterday}) AS yday
      FROM "Product" p JOIN "Category" c ON c.id = p."categoryId"`;
    const cats = await tx.$queryRaw<{ name: string; n: bigint }[]>`
      SELECT c.name, COUNT(*) AS n FROM add_to_cart_tracking a
      JOIN "Product" p ON p.id = a."productId" JOIN "Category" c ON c.id = p."categoryId"
      WHERE a."createdAt" >= ${since} AND (((a."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text >= ${first}
      GROUP BY 1 ORDER BY 2 DESC, 1`;
    const colours = await tx.$queryRaw<{ name: string; n: bigint }[]>`
      SELECT a."selectedColor" AS name, COUNT(*) AS n FROM add_to_cart_tracking a
      WHERE a."selectedColor" IS NOT NULL AND a."createdAt" >= ${since} AND (((a."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text >= ${first}
      GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 4`;
    const [opened] = await tx.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(DISTINCT q."anonymousId") AS n FROM quickview_tracking q
      WHERE q."createdAt" >= ${since} AND (((q."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text >= ${first}`;
    const [added] = await tx.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(DISTINCT c."anonymousId") AS n FROM quick_view_cart_events c
      WHERE c."eventName" = 'add_to_cart' AND c."createdAt" >= ${since} AND (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text >= ${first}`;
    return { rows, cats, colours, opened: num(opened?.n), added: num(added?.n) };
  });

  const products: Product[] = data.rows
    .map((r) => ({
      name: r.name,
      id: r.id,
      slug: r.slug,
      brand: r.brand,
      cat: r.cat,
      short: initials(r.name),
      h: hueOf(r.name),
      price: num(r.price),
      views: 0,
      qv: num(r.qv),
      atc: num(r.atc),
      yday: num(r.yday),
      opts: jsonList(r.sizes),
      cols: jsonList(r.colors),
    }))
    .filter((p) => p.qv + p.atc > 0)
    .sort((a, b) => b.atc - a.atc || b.qv - a.qv || a.name.localeCompare(b.name))
    .slice(0, TOP);
  const cats: CategoryCount[] = data.cats.map((c) => [c.name, num(c.n)] as const);
  const colours: ColourCount[] = data.colours.map((c) => [c.name, num(c.n), swatchFor(c.name)] as const);
  const qv: QuickViewStats = { seen: 0, btn: 0, eye: 0, opened: data.opened, heartCard: 0, add: data.added, detail: 0, wish: 0, closed: 0, extrasTracked: false };
  return { products, cats, colours, qv, viewsTracked: false };
}
