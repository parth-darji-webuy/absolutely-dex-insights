import "server-only";
import type { AnalyticsEvent, EventDetail, EventProps, EventsPerMinute, EventType } from "@/types";
import type { TrackingTable } from "../tables";
import { runQuery, type Tx } from "../db";
import { EVENT_META } from "../event-meta";
import { EVENT_TABLE } from "../events";

const PER_TABLE = 200;
const num = (v: unknown) => (typeof v === "bigint" ? Number(v) : Number(v ?? 0));

type Base = { id: string; anonymousId: string; createdAt: Date };
type Named = { productId: string; pname: string | null };

const priceText = (v: unknown) => (v === null || v === undefined ? null : Number(v).toFixed(2));

export type EventFilter = {
  /** Only this visitor's events, or every visitor's when null. */
  aid: string | null;
  /** Only the row with this id, or any row when null. */
  id: string | null;
  from: Date;
  to: Date;
  /** The most rows to take from each table (newest first). */
  limit: number;
};

const FOREVER = { from: new Date(0), to: new Date("2100-01-01T00:00:00Z") };

/** Events from all six tracking tables, newest first, shaped as the Events page shows them (without ids yet). */
async function queryEvents(tx: Tx, f: EventFilter): Promise<Omit<AnalyticsEvent, "id">[]> {
  const t = {
    exposure: await tx.$queryRaw<(Base & { experimentKey: string; experimentName: string | null; variationId: number; variationName: string | null; variationValue: string | null; featureId: string | null })[]>`
      SELECT id, "anonymousId", "createdAt", "experimentKey", "experimentName", "variationId", "variationName", "variationValue", "featureId"
      FROM experiment_tracking
      WHERE (${f.aid}::text IS NULL OR "anonymousId" = ${f.aid}) AND (${f.id}::text IS NULL OR id = ${f.id}) AND "createdAt" >= ${f.from} AND "createdAt" <= ${f.to}
      ORDER BY "createdAt" DESC LIMIT ${f.limit}`,
    cart: await tx.$queryRaw<(Base & { productId: string; productName: string | null; slug: string | null; brand: string | null; price: unknown; quantity: number; selectedSize: string | null; selectedColor: string | null })[]>`
      SELECT id, "anonymousId", "createdAt", "productId", "productName", slug, brand, price, quantity, "selectedSize", "selectedColor"
      FROM add_to_cart_tracking
      WHERE (${f.aid}::text IS NULL OR "anonymousId" = ${f.aid}) AND (${f.id}::text IS NULL OR id = ${f.id}) AND "createdAt" >= ${f.from} AND "createdAt" <= ${f.to}
      ORDER BY "createdAt" DESC LIMIT ${f.limit}`,
    quick: await tx.$queryRaw<(Base & Named & { customerId: string | null; featureKey: string; featureEnabled: boolean; experimentKey: string | null; variationId: number | null })[]>`
      SELECT q.id, q."anonymousId", q."createdAt", q."customerId", q."productId", p.name AS pname, q."featureKey", q."featureEnabled", q."experimentKey", q."variationId"
      FROM quickview_tracking q LEFT JOIN "Product" p ON p.id = q."productId"
      WHERE (${f.aid}::text IS NULL OR q."anonymousId" = ${f.aid}) AND (${f.id}::text IS NULL OR q.id = ${f.id}) AND q."createdAt" >= ${f.from} AND q."createdAt" <= ${f.to}
      ORDER BY q."createdAt" DESC LIMIT ${f.limit}`,
    qvCart: await tx.$queryRaw<(Base & Named & { eventName: string; source: string })[]>`
      SELECT c.id, c."anonymousId", c."createdAt", c."productId", p.name AS pname, c."eventName", c.source
      FROM quick_view_cart_events c LEFT JOIN "Product" p ON p.id = c."productId"
      WHERE (${f.aid}::text IS NULL OR c."anonymousId" = ${f.aid}) AND (${f.id}::text IS NULL OR c.id = ${f.id}) AND c."createdAt" >= ${f.from} AND c."createdAt" <= ${f.to}
      ORDER BY c."createdAt" DESC LIMIT ${f.limit}`,
    whatsNew: await tx.$queryRaw<(Base & { experimentKey: string; variationId: number; variationName: string; variationValue: string })[]>`
      SELECT id, "anonymousId", "createdAt", "experimentKey", "variationId", "variationName", "variationValue"
      FROM whats_new_tracking
      WHERE (${f.aid}::text IS NULL OR "anonymousId" = ${f.aid}) AND (${f.id}::text IS NULL OR id = ${f.id}) AND "createdAt" >= ${f.from} AND "createdAt" <= ${f.to}
      ORDER BY "createdAt" DESC LIMIT ${f.limit}`,
    theme: await tx.$queryRaw<(Base & { theme: string })[]>`
      SELECT id, "anonymousId", "createdAt", theme FROM theme_toggle_tracking
      WHERE (${f.aid}::text IS NULL OR "anonymousId" = ${f.aid}) AND (${f.id}::text IS NULL OR id = ${f.id}) AND "createdAt" >= ${f.from} AND "createdAt" <= ${f.to}
      ORDER BY "createdAt" DESC LIMIT ${f.limit}`,
  };

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
  return [
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
}

/** Newest first, numbered from 1 for the page. */
const numbered = (list: Omit<AnalyticsEvent, "id">[], newestFirst: boolean) =>
  [...list].sort((a, b) => (newestFirst ? b.ts - a.ts : a.ts - b.ts)).map((e, i) => ({ ...e, id: i + 1 }));

/** The latest events from all six tracking tables, newest first, shaped as the Events page shows them. */
export async function loadEvents(): Promise<AnalyticsEvent[]> {
  const list = await runQuery((tx) => queryEvents(tx, { aid: null, id: null, ...FOREVER, limit: PER_TABLE }));
  return numbered(list, true).slice(0, PER_TABLE);
}

export const JOURNEY_DAYS = 7;
export const JOURNEY_MAX = 100;

/**
 * One event row in full: the row as stored, and the visitor's journey, which is their events within 7 days
 * of this one (at most 100 steps, the newest, with a count of the earlier ones). Null when there is no such row.
 * `table` must already be one of the six tracking tables (see parseDetailQuery).
 */
export async function loadEventDetail(table: TrackingTable, id: string): Promise<EventDetail | null> {
  return runQuery(async (tx) => {
    const found = (await queryEvents(tx, { aid: null, id, ...FOREVER, limit: 5 })).find((e) => e.table === table);
    if (!found) return null;
    const span = JOURNEY_DAYS * 86_400_000;
    const window = { aid: found.visitor, id: null, from: new Date(found.ts - span), to: new Date(found.ts + span) };
    const all = numbered(await queryEvents(tx, { ...window, limit: JOURNEY_MAX + 1 }), false);
    const [counted] = await tx.$queryRaw<{ n: bigint }[]>`
      SELECT SUM(n) AS n FROM (
        SELECT COUNT(*) AS n FROM experiment_tracking WHERE "anonymousId" = ${found.visitor} AND "createdAt" >= ${window.from} AND "createdAt" <= ${window.to}
        UNION ALL SELECT COUNT(*) FROM add_to_cart_tracking WHERE "anonymousId" = ${found.visitor} AND "createdAt" >= ${window.from} AND "createdAt" <= ${window.to}
        UNION ALL SELECT COUNT(*) FROM quickview_tracking WHERE "anonymousId" = ${found.visitor} AND "createdAt" >= ${window.from} AND "createdAt" <= ${window.to}
        UNION ALL SELECT COUNT(*) FROM quick_view_cart_events WHERE "anonymousId" = ${found.visitor} AND "createdAt" >= ${window.from} AND "createdAt" <= ${window.to}
        UNION ALL SELECT COUNT(*) FROM whats_new_tracking WHERE "anonymousId" = ${found.visitor} AND "createdAt" >= ${window.from} AND "createdAt" <= ${window.to}
        UNION ALL SELECT COUNT(*) FROM theme_toggle_tracking WHERE "anonymousId" = ${found.visitor} AND "createdAt" >= ${window.from} AND "createdAt" <= ${window.to}
      ) c`;
    const steps = all.slice(-JOURNEY_MAX);
    // The clicked event is always in the journey, even if it fell outside the newest 100.
    const withTarget = steps.some((s) => s.rowId === id && s.table === table) ? steps : [{ ...found, id: 0 }, ...steps.slice(1)];
    const earlier = Math.max(0, num(counted?.n) - withTarget.length);
    return { event: { ...found, id: 0 }, row: await storedRowOf(tx, table, id), journey: { steps: withTarget, earlier } };
  });
}

/** The row exactly as the table holds it, columns in table order. Each table is named in full. */
async function storedRowOf(tx: Tx, table: TrackingTable, id: string): Promise<Record<string, unknown>> {
  type R = { row: string }[];
  const rows: R =
    table === "experiment_tracking" ? await tx.$queryRaw<R>`SELECT row_to_json(t)::text AS row FROM experiment_tracking t WHERE t.id = ${id}`
    : table === "add_to_cart_tracking" ? await tx.$queryRaw<R>`SELECT row_to_json(t)::text AS row FROM add_to_cart_tracking t WHERE t.id = ${id}`
    : table === "quickview_tracking" ? await tx.$queryRaw<R>`SELECT row_to_json(t)::text AS row FROM quickview_tracking t WHERE t.id = ${id}`
    : table === "quick_view_cart_events" ? await tx.$queryRaw<R>`SELECT row_to_json(t)::text AS row FROM quick_view_cart_events t WHERE t.id = ${id}`
    : table === "whats_new_tracking" ? await tx.$queryRaw<R>`SELECT row_to_json(t)::text AS row FROM whats_new_tracking t WHERE t.id = ${id}`
    : await tx.$queryRaw<R>`SELECT row_to_json(t)::text AS row FROM theme_toggle_tracking t WHERE t.id = ${id}`;
  const row = JSON.parse(rows[0]?.row ?? "{}") as Record<string, unknown>;
  // The database writes times without a zone; they are UTC.
  if (typeof row.createdAt === "string" && !/(Z|[+-]\d\d:?\d\d)$/.test(row.createdAt)) row.createdAt += "Z";
  return row;
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
