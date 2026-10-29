// Small, fixed data for tests only. No page or route imports this file.
import { buildExperiment } from "@/lib/store/build-experiment";
import { EVENT_META } from "@/lib/event-meta";
import type { AnalyticsEvent, CategoryCount, ColourCount, EventType, Experiment, IdleVisitor, Overview, Product, ProductsData, QuickViewStats, RecentWindow, Zone } from "@/types";

export const PRODUCTS: Product[] = [
  { name: "Chronos Obsidian Sapphire Watch", id: "p1", slug: "chronos", brand: "Chronos Atelier", cat: "Watches", short: "CW", h: 250, price: 520, views: 3920, qv: 562, atc: 412, yday: 68, opts: ["42mm"], cols: ["Obsidian Black"] },
  { name: "Nimbus Pro Wireless Earbuds", id: "p2", slug: "nimbus", brand: "Nimbus Audio", cat: "Technology", short: "NE", h: 205, price: 179, views: 2410, qv: 398, atc: 338, yday: 52, opts: [], cols: ["Matte Black"] },
  { name: "Atlas Leather Weekender", id: "p3", slug: "atlas", brand: "Atlas & Co", cat: "Bags", short: "AW", h: 30, price: 245, views: 1980, qv: 314, atc: 276, yday: 41, opts: [], cols: ["Cognac"] },
  { name: "Linea Relaxed Linen Overshirt", id: "p4", slug: "linea", brand: "Maison Linea", cat: "Fashion", short: "LO", h: 165, price: 89, views: 3120, qv: 336, atc: 214, yday: 30, opts: ["M"], cols: ["Sand"] },
  { name: "Aperture R4 Mirrorless 8K Camera", id: "p5", slug: "aperture", brand: "Aperture Optics", cat: "Technology", short: "AR", h: 330, price: 3299, views: 2860, qv: 262, atc: 176, yday: 23, opts: [], cols: ["Matte Graphite"] },
];
export const CATS: CategoryCount[] = [["Technology", 514], ["Watches", 412], ["Bags", 276], ["Fashion", 214]];
export const COLOURS: ColourCount[] = [["Black", 481, "#16181d"], ["White", 382, "#f4f4f2"], ["Matte Graphite", 227, "#4a4d55"], ["Cognac", 156, "#9a5a2e"]];
export const QV: QuickViewStats = { seen: 6240, btn: 1498, eye: 374, opened: 1872, heartCard: 87, add: 393, detail: 337, wish: 112, closed: 1030, extrasTracked: true };
export const PRODUCTS_DATA: ProductsData = { products: PRODUCTS, cats: CATS, colours: COLOURS, qv: QV, viewsTracked: true };

const DAYS = ["2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"];

/** A test built the way the real ones are, from daily counts. `people` and `conv` are per variant, spread over `days`. */
function experiment(key: string, flag: string, name: string, labels: [string, string], people: [number, number], conv: [number, number], days: string[], daily?: [number[], number[]]): Experiment {
  const spread = (total: number, k: number) => days.map((_, i) => Math.floor(total / days.length) + (i < total % days.length ? 1 : 0)).map((n) => (k ? n : n));
  const c = daily?.[0] ?? spread(people[0], 0);
  const t = daily?.[1] ?? spread(people[1], 1);
  const per = (arr: number[], total: number, all: number) => Object.fromEntries(days.map((d, i) => [d, Math.round((arr[i] / all) * total)]));
  return buildExperiment({
    key,
    flag,
    name,
    control: { label: labels[0], value: "false" },
    treatment: { label: labels[1], value: "true" },
    status: "Running",
    days,
    start: "Oct 6, 2026",
    counts: {
      people: { 0: Object.fromEntries(days.map((d, i) => [d, c[i]])), 1: Object.fromEntries(days.map((d, i) => [d, t[i]])) },
      converted: { 0: per(c, conv[0], c.reduce((a, b) => a + b, 0)), 1: per(t, conv[1], t.reduce((a, b) => a + b, 0)) },
    },
  });
}

/** Four tests. The first has an uneven last day (106 against 76), the others an even split. */
export const EXPS: Experiment[] = [
  experiment("add-to-cart", "add-to-cart", "Add to Cart button text", ["Add to Cart", "Buy Now"], [1000, 1000], [100, 120], DAYS, [[74, 82, 86, 88, 91, 93, 92, 94, 91, 103, 106], [76, 86, 90, 92, 94, 97, 96, 98, 95, 100, 76]]),
  experiment("quick-view-ab-test", "quick-view-enabled", "Quick view on product cards", ["No quick view", "Quick view"], [920, 920], [90, 96], DAYS.slice(0, 6)),
  experiment("new-ab-test", "whats-new", "What’s New A/B Test", ["Plain link", "Highlighted + NEW"], [1320, 1320], [53, 79], DAYS.slice(0, 9)),
  experiment("theme-toggle", "toggle-theme", "Theme toggle label", ["Icon only", "Icon + label"], [1050, 1050], [42, 58], DAYS.slice(0, 8)),
];
export const EBY: Record<string, Experiment> = Object.fromEntries(EXPS.map((e) => [e.key, e]));

export const ZONES: Zone[] = [
  { k: "whatsnew", x: 10, icon: "spark", label: "opened What’s New", n: 3 },
  { k: "browse", x: 30, icon: "search", label: "browsed products", n: 41 },
  { k: "theme", x: 50, icon: "moonS", label: "switched theme", n: 3 },
  { k: "quick", x: 70, icon: "eye", label: "opened quick view", n: 9 },
  { k: "cart", x: 90, icon: "bag", label: "added to cart", n: 7 },
];
export const IDLE: IdleVisitor[] = [
  { zone: "whatsnew", x: 14, prop: "phone", seed: "wE8bA3iUc6Ry" },
  { zone: "browse", x: 25, prop: "phone", seed: "Rb7nW3eYs0Qd" },
  { zone: "quick", x: 66, prop: "glass", seed: "Xm1fJ6gNq9Ea" },
  { zone: "cart", x: 94, prop: "bag", seed: "dS5yK0rTw7Bc" },
];
export const RECENT_MIN = 30;
export const RECENT: Record<string, RecentWindow> = Object.fromEntries(
  EXPS.map((e, i) => [e.key, { c: [25 - i, 2], t: [24 - i, 3], mins: Array.from({ length: RECENT_MIN }, (_, m) => (m + i) % 4) }]),
);

/** The hero visitor's journey, then filler events. Newest first. */
export function makeEvents(now: number, filler = 40): AnalyticsEvent[] {
  const hero = "kT9xQ2mLpA4w";
  const base = { env: "production" as const, product: null, props: {} };
  const list: AnalyticsEvent[] = [
    { ...base, id: 1, rowId: "r1", ts: now - 232e3, event: "experiment_exposure", visitor: hero, table: "experiment_tracking", props: { experimentName: "Add to Cart button text", variationName: "Buy Now" }, variationName: "Buy Now", experimentKey: "add-to-cart" },
    { ...base, id: 2, rowId: "r2", ts: now - 203e3, event: "quick_view_clicked", visitor: hero, table: "quickview_tracking", product: "Chronos Obsidian Sapphire Watch" },
    { ...base, id: 3, rowId: "r3", ts: now - 178e3, event: "theme_toggle", visitor: hero, table: "theme_toggle_tracking", props: { theme: "dark" }, theme: "dark" },
    { ...base, id: 4, rowId: "r4", ts: now - 131e3, event: "add_to_cart", visitor: hero, table: "add_to_cart_tracking", product: "Chronos Obsidian Sapphire Watch", props: { quantity: 1 }, size: "42mm", colour: "Obsidian Black", price: 520 },
    { ...base, id: 5, rowId: "r5", ts: now - 130e3, event: "quick_view_cart", visitor: hero, table: "quick_view_cart_events", product: "Chronos Obsidian Sapphire Watch" },
  ];
  const kinds: [EventType, string][] = [["experiment_exposure", "experiment_tracking"], ["add_to_cart", "add_to_cart_tracking"], ["quick_view_clicked", "quickview_tracking"], ["theme_toggle", "theme_toggle_tracking"], ["whats_new_clicked", "whats_new_tracking"]];
  for (let i = 0; i < filler; i++) {
    const [event, table] = kinds[i % kinds.length];
    list.push({ ...base, id: 6 + i, rowId: `f${i}`, ts: now - 4e3 - i * 20e3, event, visitor: `visitor${i % 7}x`, table, props: {}, product: event === "add_to_cart" ? "Nimbus Pro Wireless Earbuds" : null, price: event === "add_to_cart" ? 179 : undefined });
  }
  return list.sort((a, b) => b.ts - a.ts);
}

const daily = (n: number): number[] => Array.from({ length: 7 }, (_, i) => n + i);
export const OVERVIEW: Overview = {
  days: ["Oct 10", "Oct 11", "Oct 12", "Oct 13", "Oct 14", "Oct 15", "Oct 16"],
  visitors: daily(1650),
  visitorsPrevWeek: 11620,
  lastActivity: null,
  addToCarts: daily(178),
  addToCartsPrevWeek: 1200,
  flagCounts: [2, 3, 3, 4, 4, 4, 4],
  runningCounts: [3, 4, 4, 4, 4, 4, 4],
  eventMeta: EVENT_META,
  daily: { experiment_exposure: daily(880), add_to_cart: daily(178), quick_view_clicked: daily(240), theme_toggle: daily(60), whats_new_clicked: daily(34), quick_view_cart: daily(49) },
};
