import "server-only";
import type { AnalyticsEvent, EventProps, EventsPerMinute, EventType } from "@/types";
import { runQuery } from "../db";
import { EVENT_META } from "../event-meta";
import { EVENT_TABLE } from "../events";

const PER_TABLE = 200;
const num = (v: unknown) => (typeof v === "bigint" ? Number(v) : Number(v ?? 0));

type Base = { id: string; anonymousId: string; createdAt: Date };
type Named = { productId: string; pname: string | null };

const priceText = (v: unknown) => (v === null || v === undefined ? null : Number(v).toFixed(2));

/** The latest events from all six tracking tables, newest first, shaped as the Events page shows them. */
export async function loadEvents(): Promise<AnalyticsEvent[]> {
  const t = await runQuery(async (tx) => ({
    exposure: await tx.$queryRaw<(Base & { experimentKey: string; experimentName: string | null; variationId: number; variationName: string | null; variationValue: string | null; featureId: string | null })[]>`
      SELECT id, "anonymousId", "createdAt", "experimentKey", "experimentName", "variationId", "variationName", "variationValue", "featureId"
      FROM experiment_tracking ORDER BY "createdAt" DESC LIMIT ${PER_TABLE}`,
    cart: await tx.$queryRaw<(Base & { productId: string; productName: string | null; slug: string | null; brand: string | null; price: unknown; quantity: number; selectedSize: string | null; selectedColor: string | null })[]>`
      SELECT id, "anonymousId", "createdAt", "productId", "productName", slug, brand, price, quantity, "selectedSize", "selectedColor"
      FROM add_to_cart_tracking ORDER BY "createdAt" DESC LIMIT ${PER_TABLE}`,
    quick: await tx.$queryRaw<(Base & Named & { customerId: string | null; featureKey: string; featureEnabled: boolean; experimentKey: string | null; variationId: number | null })[]>`
      SELECT q.id, q."anonymousId", q."createdAt", q."customerId", q."productId", p.name AS pname, q."featureKey", q."featureEnabled", q."experimentKey", q."variationId"
      FROM quickview_tracking q LEFT JOIN "Product" p ON p.id = q."productId" ORDER BY q."createdAt" DESC LIMIT ${PER_TABLE}`,
    qvCart: await tx.$queryRaw<(Base & Named & { eventName: string; source: string })[]>`
      SELECT c.id, c."anonymousId", c."createdAt", c."productId", p.name AS pname, c."eventName", c.source
      FROM quick_view_cart_events c LEFT JOIN "Product" p ON p.id = c."productId" ORDER BY c."createdAt" DESC LIMIT ${PER_TABLE}`,
    whatsNew: await tx.$queryRaw<(Base & { experimentKey: string; variationId: number; variationName: string; variationValue: string })[]>`
      SELECT id, "anonymousId", "createdAt", "experimentKey", "variationId", "variationName", "variationValue"
      FROM whats_new_tracking ORDER BY "createdAt" DESC LIMIT ${PER_TABLE}`,
    theme: await tx.$queryRaw<(Base & { theme: string })[]>`
      SELECT id, "anonymousId", "createdAt", theme FROM theme_toggle_tracking ORDER BY "createdAt" DESC LIMIT ${PER_TABLE}`,
  }));

  const make = (r: Base, event: EventType, props: EventProps, extra: Partial<AnalyticsEvent> = {}): Omit<AnalyticsEvent, "id"> => ({
    rowId: r.id,
    ts: r.createdAt.getTime(),
    event,
    visitor: r.anonymousId,
    env: "production",
    table: EVENT_TABLE[event],
    product: null,
    props,
    ...extra,
  });
  const list: Omit<AnalyticsEvent, "id">[] = [
    ...t.exposure.map((r) =>
      make(r, "experiment_exposure", { experimentKey: r.experimentKey, experimentName: r.experimentName, variationId: r.variationId, variationName: r.variationName, variationValue: r.variationValue, featureId: r.featureId }, { experimentKey: r.experimentKey, variationName: r.variationName ?? undefined }),
    ),
    ...t.cart.map((r) =>
      make(r, "add_to_cart", { productId: r.productId, productName: r.productName, slug: r.slug, brand: r.brand, price: priceText(r.price), quantity: r.quantity, selectedSize: r.selectedSize, selectedColor: r.selectedColor }, { product: r.productName, size: r.selectedSize ?? undefined, colour: r.selectedColor ?? undefined, price: r.price === null ? undefined : Number(r.price) }),
    ),
    ...t.quick.map((r) =>
      make(r, "quick_view_clicked", { customerId: r.customerId, productId: r.productId, featureKey: r.featureKey, featureEnabled: r.featureEnabled, experimentKey: r.experimentKey, variationId: r.variationId }, { product: r.pname }),
    ),
    ...t.qvCart.map((r) => make(r, "quick_view_cart", { productId: r.productId, eventName: r.eventName, source: r.source }, { product: r.pname })),
    ...t.whatsNew.map((r) =>
      make(r, "whats_new_clicked", { experimentKey: r.experimentKey, variationId: r.variationId, variationName: r.variationName, variationValue: r.variationValue }, { experimentKey: r.experimentKey, variationName: r.variationName }),
    ),
    ...t.theme.map((r) => make(r, "theme_toggle", { theme: r.theme }, { theme: r.theme })),
  ];
  return list
    .sort((a, b) => b.ts - a.ts)
    .slice(0, PER_TABLE)
    .map((e, i) => ({ ...e, id: i + 1 }));
}

/** Events in each of the last 60 minutes, split by type. */
export async function loadEventsPerMinute(now: Date = new Date()): Promise<EventsPerMinute> {
  const since = new Date(now.getTime() - 60 * 60_000);
  type Row = { src: EventType; ago: number; n: bigint };
  const rows = await runQuery((tx) =>
    tx.$queryRaw<Row[]>`
      SELECT src, FLOOR(EXTRACT(EPOCH FROM (${now}::timestamp - at)) / 60)::int AS ago, COUNT(*) AS n FROM (
        SELECT 'experiment_exposure' AS src, c."createdAt" AS at FROM experiment_tracking c WHERE c."createdAt" >= ${since} AND c."createdAt" <= ${now}
        UNION ALL SELECT 'add_to_cart', c."createdAt" FROM add_to_cart_tracking c WHERE c."createdAt" >= ${since} AND c."createdAt" <= ${now}
        UNION ALL SELECT 'quick_view_clicked', c."createdAt" FROM quickview_tracking c WHERE c."createdAt" >= ${since} AND c."createdAt" <= ${now}
        UNION ALL SELECT 'theme_toggle', c."createdAt" FROM theme_toggle_tracking c WHERE c."createdAt" >= ${since} AND c."createdAt" <= ${now}
        UNION ALL SELECT 'whats_new_clicked', c."createdAt" FROM whats_new_tracking c WHERE c."createdAt" >= ${since} AND c."createdAt" <= ${now}
        UNION ALL SELECT 'quick_view_cart', c."createdAt" FROM quick_view_cart_events c WHERE c."createdAt" >= ${since} AND c."createdAt" <= ${now}
      ) u GROUP BY 1, 2`,
  );
  const types = Object.keys(EVENT_META) as EventType[];
  const labels = Array.from({ length: 60 }, (_, i) => (i === 59 ? "now" : `−${59 - i}m`));
  const series = types.map((key) => ({
    key,
    name: EVENT_META[key].label,
    color: EVENT_META[key].c,
    values: Array.from({ length: 60 }, (_, i) => num(rows.find((r) => r.src === key && Math.min(Math.max(r.ago, 0), 59) === 59 - i)?.n)),
  }));
  return { labels, series };
}
