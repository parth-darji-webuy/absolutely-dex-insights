import { rng } from "@/lib/rng";
import type { AnalyticsEvent, EventSchema, EventType, IdKind } from "@/types";
import { EBY, EXPS } from "./experiments";
import { PRODUCTS } from "./products";

export const VISITORS = ["kT9xQ2mLpA4w", "Rb7nW3eYs0Qd", "pZ4cH8uVt2Lk", "Xm1fJ6gNq9Ea", "dS5yK0rTw7Bc", "Hq2vL9oPz4Mn", "wE8bA3iUc6Ry", "Nc0gT5hXk1Js", "gY3mR8sDq2Vo", "Lf6tB1zKp9Wu"];

// The Neon tracking tables: where each event is written, whether the row knows its variant, and its id type.
export const EVT_SCHEMA: Record<EventType, EventSchema> = {
  experiment_exposure: { table: "experiment_tracking", variation: "yes", id: "uuid" },
  add_to_cart: { table: "add_to_cart_tracking", variation: "no", id: "uuid" },
  quick_view_clicked: { table: "quickview_tracking", variation: "hardcoded", id: "cuid" },
  quick_view_cart: { table: "quick_view_cart_events", variation: "no", id: "uuid" },
  whats_new_clicked: { table: "whats_new_tracking", variation: "stored", id: "cuid" },
  theme_toggle: { table: "theme_toggle_tracking", variation: "no", id: "uuid" },
};
export const ALL_TABLES = Object.values(EVT_SCHEMA).map((x) => x.table);

type Rand = () => number;
type Overrides = { product?: string; size?: string; colour?: string; theme?: string; exp?: string; vid?: number };

// ids as the database makes them: uuid() for most tables, cuid() for quickview_tracking and whats_new_tracking
const hexs = (r: Rand, n: number) => Array.from({ length: n }, () => Math.floor(r() * 16).toString(16)).join("");
const rowId = (kind: IdKind, r: Rand) =>
  kind === "cuid"
    ? "c" + Array.from({ length: 24 }, () => Math.floor(r() * 36).toString(36)).join("")
    : `${hexs(r, 8)}-${hexs(r, 4)}-4${hexs(r, 3)}-${"89ab"[Math.floor(r() * 4)]}${hexs(r, 3)}-${hexs(r, 12)}`;

const RUNNING = EXPS.filter((e) => e.status === "Running");

function mkEvent(id: number, type: EventType, visitor: string, ts: number, o: Overrides, r: Rand): AnalyticsEvent {
  const sc = EVT_SCHEMA[type];
  const e: AnalyticsEvent = { id, rowId: rowId(sc.id, r), ts, event: type, visitor, env: "production", table: sc.table, product: null, props: {} };
  const pick = <T>(a: T[]): T => a[Math.floor(r() * a.length)];
  // props = the row's columns between anonymousId and createdAt, in table order
  if (type === "add_to_cart" || type === "quick_view_clicked" || type === "quick_view_cart") {
    const p = o.product ? PRODUCTS.find((x) => x.name === o.product)! : pick(PRODUCTS);
    e.product = p.name;
    if (type === "add_to_cart") {
      e.props = { productId: p.id, productName: p.name, slug: p.slug, brand: p.brand, price: p.price.toFixed(2), quantity: r() < 0.9 ? 1 : 2, selectedSize: o.size || pick(p.opts), selectedColor: o.colour || pick(p.cols) };
    } else if (type === "quick_view_clicked") {
      e.props = { customerId: null, productId: p.id, featureKey: "quick-view-enabled", featureEnabled: true, experimentKey: "quick-view-ab-test", variationId: 1 };
    } else {
      e.props = { productId: p.id, eventName: "add_to_cart", source: "quick_view" };
    }
  }
  if (type === "experiment_exposure") {
    const x = o.exp ? EBY[o.exp] : pick(RUNNING);
    const vid = o.vid ?? (r() < 0.5 ? 0 : 1);
    e.props = { experimentKey: x.key, experimentName: x.name, variationId: vid, variationName: vid ? x.t.label : x.c.label, variationValue: x.values[vid], featureId: x.flag };
  }
  if (type === "theme_toggle") e.props = { theme: o.theme || (r() < 0.64 ? "dark" : "light") };
  if (type === "whats_new_clicked") {
    const x = EBY["whats-new-ab-test"];
    const vid = o.vid ?? (r() < 0.5 ? 0 : 1);
    e.props = { experimentKey: x.key, variationId: vid, variationName: vid ? x.t.label : x.c.label, variationValue: x.values[vid] };
  }
  // convenience mirrors used by the UI
  const p = e.props;
  Object.assign(e, {
    size: p.selectedSize,
    colour: p.selectedColor,
    price: p.price ? Number(p.price) : undefined,
    theme: p.theme,
    experimentKey: p.experimentKey,
    variationName: p.variationName,
  });
  return e;
}

const TYPES_W: EventType[] = ["experiment_exposure", "experiment_exposure", "experiment_exposure", "quick_view_clicked", "quick_view_clicked", "add_to_cart", "add_to_cart", "quick_view_cart", "theme_toggle", "whats_new_clicked"];

/**
 * Seeded sample events, newest first: one hero visitor journey, then 40 random ones.
 * The same events (ids, types, products, gaps) appear every time; only `now` moves them in time.
 */
export function generateEvents(now: number = Date.now()): AnalyticsEvent[] {
  const r = rng(42);
  const list: AnalyticsEvent[] = [];
  let id = 0;
  const add = (type: EventType, visitor: string, ts: number, o: Overrides = {}) => list.push(mkEvent(++id, type, visitor, ts, o, r));
  // Hero journey: saw Buy Now → quick view → dark mode → added Chronos Obsidian Sapphire Watch to cart
  const H = "kT9xQ2mLpA4w";
  add("experiment_exposure", H, now - 232e3, { exp: "add-to-cart", vid: 1 });
  add("quick_view_clicked", H, now - 203e3, { product: "Chronos Obsidian Sapphire Watch" });
  add("theme_toggle", H, now - 178e3, { theme: "dark" });
  add("add_to_cart", H, now - 131e3, { product: "Chronos Obsidian Sapphire Watch", size: "42mm", colour: "Obsidian Black" });
  add("quick_view_cart", H, now - 130e3, { product: "Chronos Obsidian Sapphire Watch" });
  let t = now - 4e3;
  for (let i = 0; i < 40; i++) {
    t -= 8e3 + r() * 70e3;
    const v = VISITORS[1 + Math.floor(r() * (VISITORS.length - 1))];
    add(TYPES_W[Math.floor(r() * TYPES_W.length)], v, t);
  }
  return list.sort((a, b) => b.ts - a.ts);
}
