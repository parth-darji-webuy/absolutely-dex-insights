import "server-only";
import type { EventType, IdleVisitor, Overview, StoreLast30, Zone, ZoneKey } from "@/types";
import { runQuery } from "../db";
import { getEnv } from "../env";
import { ymd } from "../dates";
import { EVENT_META } from "../event-meta";
import { dayLabel, lastDays, shiftDay } from "../tz";
import { loadExperiments, loadRecent } from "./experiments";
import { getGrowthBook } from "./growthbook";

const num = (v: bigint | number | null | undefined) => Number(v ?? 0);
/** Query a day or two wider than needed, then cut to exact local days in SQL. */
const widen = (firstDay: string) => new Date(Date.parse(`${shiftDay(firstDay, -1)}T00:00:00Z`));

type CountRow = { src: EventType; day: string; n: bigint };
type VisitorRow = { day: string; visitors: number };

const EVENT_TYPES = Object.keys(EVENT_META) as EventType[];

/** Seven days ending today, plus the seven before for the week-on-week comparison. */
export async function loadOverview(now: Date = new Date()): Promise<Overview> {
  const { INSIGHTS_TIMEZONE: tz } = getEnv();
  const fortnight = lastDays(14, tz, now);
  const days = fortnight.slice(7);
  const since = widen(fortnight[0]);
  const [{ counts, visitors, prevVisitors }, experiments, gb] = await Promise.all([
    runQuery(async (tx) => {
      const counts = await tx.$queryRaw<CountRow[]>`
        SELECT src, day, COUNT(*) AS n FROM (
          SELECT 'experiment_exposure' AS src, (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text AS day FROM experiment_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT 'add_to_cart', (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text FROM add_to_cart_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT 'quick_view_clicked', (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text FROM quickview_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT 'theme_toggle', (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text FROM theme_toggle_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT 'whats_new_clicked', (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text FROM whats_new_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT 'quick_view_cart', (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text FROM quick_view_cart_events c WHERE c."createdAt" >= ${since}
        ) u GROUP BY 1, 2`;
      const people = await tx.$queryRaw<{ aid: string; day: string }[]>`
        SELECT DISTINCT aid, day FROM (
          SELECT c."anonymousId" AS aid, (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text AS day FROM experiment_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT c."anonymousId", (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text FROM add_to_cart_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT c."anonymousId", (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text FROM quickview_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT c."anonymousId", (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text FROM theme_toggle_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT c."anonymousId", (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text FROM whats_new_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT c."anonymousId", (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date)::text FROM quick_view_cart_events c WHERE c."createdAt" >= ${since}
        ) u`;
      // A person counts once per day, and once across the whole week.
      const perDay = new Map<string, Set<string>>();
      for (const p of people) (perDay.get(p.day) ?? perDay.set(p.day, new Set()).get(p.day)!).add(p.aid);
      const visitors: VisitorRow[] = [...perDay].map(([day, s]) => ({ day, visitors: s.size }));
      const week = (list: string[]) => new Set(people.filter((p) => list.includes(p.day)).map((p) => p.aid)).size;
      return { counts, visitors, prevVisitors: week(fortnight.slice(0, 7)) };
    }),
    loadExperiments(now),
    getGrowthBook(),
  ]);

  const countOf = (src: EventType, day: string) => num(counts.find((r) => r.src === src && r.day === day)?.n);
  const daily = Object.fromEntries(EVENT_TYPES.map((t) => [t, days.map((d) => countOf(t, d))])) as Record<EventType, number[]>;
  const prevAtc = fortnight.slice(0, 7).reduce((s, d) => s + countOf("add_to_cart", d), 0);
  const flags = new Set([...(gb?.flags ?? []), ...experiments.map((e) => e.flag)]).size;
  return {
    days: days.map(dayLabel),
    visitors: days.map((d) => num(visitors.find((v) => v.day === d)?.visitors)),
    visitorsPrevWeek: prevVisitors,
    addToCarts: daily.add_to_cart,
    addToCartsPrevWeek: prevAtc,
    flagCounts: days.map(() => flags),
    runningCounts: days.map((d) => experiments.filter((e) => e.status === "Running" && ymd(new Date(e.start)) <= d).length),
    // The store records no referrer or device, so these stay empty (the cards say "Not tracked yet").
    sources: [],
    devices: [],
    eventMeta: EVENT_META,
    daily,
  };
}

const ZONES: { k: ZoneKey; x: number; icon: Zone["icon"]; label: string; src: EventType }[] = [
  { k: "whatsnew", x: 10, icon: "spark", label: "opened What’s New", src: "whats_new_clicked" },
  { k: "browse", x: 30, icon: "search", label: "browsed products", src: "experiment_exposure" },
  { k: "theme", x: 50, icon: "moonS", label: "switched theme", src: "theme_toggle" },
  { k: "quick", x: 70, icon: "eye", label: "opened quick view", src: "quick_view_clicked" },
  { k: "cart", x: 90, icon: "bag", label: "added to cart", src: "add_to_cart" },
];
const PROPS: IdleVisitor["prop"][] = ["", "phone", "glass", "bag"];
const MINUTES = 30;

/** What people did in the last 30 minutes, stop by stop. */
export async function loadStoreLast30(now: Date = new Date()): Promise<StoreLast30> {
  const since = new Date(now.getTime() - MINUTES * 60_000);
  const exps = await loadExperiments(now);
  const [{ rows, visitors }, recent] = await Promise.all([
    runQuery(async (tx) => {
      const rows = await tx.$queryRaw<{ src: EventType; aid: string }[]>`
        SELECT src, aid FROM (
          SELECT 'experiment_exposure' AS src, c."anonymousId" AS aid, c."createdAt" AS at FROM experiment_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT 'add_to_cart', c."anonymousId", c."createdAt" FROM add_to_cart_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT 'quick_view_clicked', c."anonymousId", c."createdAt" FROM quickview_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT 'theme_toggle', c."anonymousId", c."createdAt" FROM theme_toggle_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT 'whats_new_clicked', c."anonymousId", c."createdAt" FROM whats_new_tracking c WHERE c."createdAt" >= ${since}
        ) u ORDER BY at DESC LIMIT 2000`;
      const [counted] = await tx.$queryRaw<{ n: bigint }[]>`
        SELECT COUNT(DISTINCT aid) AS n FROM (
          SELECT c."anonymousId" AS aid FROM experiment_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT c."anonymousId" FROM add_to_cart_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT c."anonymousId" FROM quickview_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT c."anonymousId" FROM theme_toggle_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT c."anonymousId" FROM whats_new_tracking c WHERE c."createdAt" >= ${since}
          UNION ALL SELECT c."anonymousId" FROM quick_view_cart_events c WHERE c."createdAt" >= ${since}
        ) u`;
      return { rows, visitors: num(counted?.n) };
    }),
    loadRecent(exps.filter((e) => e.status === "Running").map((e) => e.key), MINUTES, now),
  ]);
  const zones: Zone[] = ZONES.map((z) => ({ k: z.k, x: z.x, icon: z.icon, label: z.label, n: new Set(rows.filter((r) => r.src === z.src).map((r) => r.aid)).size }));
  // Up to three people standing at each stop. The seed only decides how the figure looks and is never shown.
  const idle: IdleVisitor[] = ZONES.flatMap((z) =>
    [...new Set(rows.filter((r) => r.src === z.src).map((r) => r.aid))].slice(0, 3).map((aid, i): IdleVisitor => ({ zone: z.k, x: Math.min(98, z.x + (i - 1) * 4), prop: PROPS[(aid.charCodeAt(0) + i) % PROPS.length], seed: aid })),
  );
  return { minutes: MINUTES, visitors, zones, idle, recent };
}
