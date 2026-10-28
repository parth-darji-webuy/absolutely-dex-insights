import { beforeEach, describe, expect, it, vi } from "vitest";

// A pretend database: every query the loaders send is answered by `answer`, given the SQL text.
type Answer = (sql: string, values: unknown[]) => unknown[];
let answer: Answer = () => [];
const sent: string[] = [];

// connection() only works inside a Next.js request.
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("../db", () => ({
  runQuery: async (fn: (tx: unknown) => unknown) =>
    fn({
      $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
        const sql = strings.join("?");
        sent.push(sql);
        return answer(sql, values);
      },
      $executeRaw: async () => 0,
    }),
}));
let minutes = 30;
vi.mock("../env", () => ({ getEnv: () => ({ INSIGHTS_TIMEZONE: "UTC", STORE_REFRESH_MINUTES: minutes, GROWTHBOOK_API_HOST: "https://x.example", GROWTHBOOK_CLIENT_KEY: "sdk-test" }) }));
let gb: { flags: string[]; experiments: { key: string; flag: string; values: string[]; names: (string | undefined)[]; name?: string }[] } | null = null;
vi.mock("./growthbook", () => ({ getGrowthBook: async () => gb }));

const { getEvents, getEventsPerMinute, getExperiment, getExperiments, getOverview, getProducts, getReportRows, getStoreLast30 } = await import("../data");
const { loadExperiments } = await import("./experiments");
const { loadEvents } = await import("./events");
const { loadProducts, jsonList } = await import("./products");
const { loadOverview } = await import("./overview");
const { loadReportRows } = await import("./reports");
const { loadStoreLast30 } = await import("./overview");
const { loadEventDetail, JOURNEY_MAX } = await import("./events");

const NOW = new Date("2026-10-29T10:00:00Z");
const BAD = /NaN|undefined|Infinity/;

beforeEach(() => {
  answer = () => [];
  gb = null;
  minutes = 30;
  sent.length = 0;
});

describe("with an empty database", () => {
  it("every page's data comes back as zeros and empty lists, never NaN", async () => {
    const all = await Promise.all([getOverview(), getStoreLast30(), getExperiments(), getExperiment("nope"), getEvents(), getEventsPerMinute(), getProducts(), getReportRows("nope", new Date(2026, 9, 1), new Date(2026, 9, 7))]);
    expect(JSON.stringify(all)).not.toMatch(BAD);
    const [overview, store, exps, one, events, perMinute, products, rows] = all;
    expect(overview.days).toHaveLength(7);
    expect(overview.visitors).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(overview.sources).toEqual([]);
    expect(store.visitors).toBe(0);
    expect(store.zones.map((z) => z.n)).toEqual([0, 0, 0, 0, 0]);
    expect(exps).toEqual([]);
    expect(one).toBeNull();
    expect(events).toEqual([]);
    expect(perMinute.labels).toHaveLength(60);
    expect(perMinute.series.every((s) => s.values.every((v) => v === 0))).toBe(true);
    expect(products).toMatchObject({ products: [], cats: [], colours: [], viewsTracked: false });
    expect(rows).toEqual([]);
  });

  it("an empty or backwards period gives no report rows", async () => {
    expect(await getReportRows("any", new Date(2026, 9, 7), new Date(2026, 9, 1))).toEqual([]);
  });
});

describe("experiments", () => {
  const exposure = (key: string, vid: number, day: string, people: number, vname = vid ? "Treatment" : "Control") => ({ key, vid, vname, vvalue: String(!!vid), flag: "quick-view-enabled", ename: "Quick View A/B Test", day, people: people });

  it("builds an experiment from daily rows and conversion rows", async () => {
    answer = (sql) => {
      if (sql.includes("FROM experiment_tracking\n    GROUP BY")) return [exposure("qv", 0, "2026-10-27", 100), exposure("qv", 1, "2026-10-27", 100), exposure("qv", 1, "2026-10-28", 50)];
      if (sql.includes("add_to_cart_tracking m")) return [{ key: "qv", vid: 0, day: "2026-10-27", converted: 10 }, { key: "qv", vid: 1, day: "2026-10-27", converted: 20 }];
      return [];
    };
    const [e] = await loadExperiments(NOW);
    expect([e.key, e.flag, e.name, e.status, e.start, e.days]).toEqual(["qv", "quick-view-enabled", "Quick View A/B Test", "Running", "Oct 27, 2026", 3]);
    expect([e.c.people, e.c.conv, e.t.people, e.t.conv]).toEqual([100, 10, 150, 20]);
    expect(e.daily).toEqual({ c: [100, 0, 0], t: [100, 50, 0] });
    expect(e.c.label).toBe("Control");
  });

  it("marks a test Stopped when GrowthBook is down and nobody came for a week", async () => {
    answer = (sql) => (sql.includes("GROUP BY 1, 2, 7") ? [exposure("old", 0, "2026-10-01", 5), exposure("old", 1, "2026-10-01", 5)] : []);
    expect((await loadExperiments(NOW))[0].status).toBe("Stopped");
  });

  it("uses GrowthBook for names and for which tests are running, and lists tests nobody has entered", async () => {
    gb = { flags: ["f1", "f2"], experiments: [{ key: "fresh", flag: "f2", values: ["false", "true"], names: ["Plain", "Fancy"], name: "Fresh test" }] };
    const list = await loadExperiments(NOW);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ key: "fresh", name: "Fresh test", flag: "f2", status: "Running", people: 0 });
    expect([list[0].c.label, list[0].t.label]).toEqual(["Plain", "Fancy"]);
  });

  it("sends every table name as written SQL, with the experiment keys as a parameter", async () => {
    answer = (sql) => (sql.includes("GROUP BY 1, 2, 7") ? [exposure("qv", 0, "2026-10-27", 1)] : []);
    await loadExperiments(NOW);
    expect(sent.some((s) => s.includes("add_to_cart_tracking m"))).toBe(true);
    expect(sent.every((s) => !/\bDELETE\b|\bINSERT\b|\bUPDATE\b|\bDROP\b/i.test(s))).toBe(true);
  });
});

describe("report rows", () => {
  it("gives two rows per day from the start of the test, with exact counts", async () => {
    answer = (sql) => {
      if (sql.includes("GROUP BY 1, 2, 7")) return [{ key: "qv", vid: 0, vname: "Control", vvalue: "false", flag: "f", ename: "QV", day: "2026-10-27", people: 100 }, { key: "qv", vid: 1, vname: "Treatment", vvalue: "true", flag: "f", ename: "QV", day: "2026-10-27", people: 100 }];
      if (sql.includes("add_to_cart_tracking m")) return [{ key: "qv", vid: 0, day: "2026-10-27", converted: 7 }, { key: "qv", vid: 1, day: "2026-10-27", converted: 9 }];
      return [];
    };
    const rows = await loadReportRows("qv", new Date(2026, 9, 20), new Date(2026, 9, 28), NOW);
    expect(rows.map((r) => [r.date, r.variant, r.people, r.converted, r.ratePct])).toEqual([
      ["2026-10-27", "control", 100, 7, "7.00"],
      ["2026-10-27", "treatment", 100, 9, "9.00"],
      ["2026-10-28", "control", 0, 0, "0.00"],
      ["2026-10-28", "treatment", 0, 0, "0.00"],
    ]);
    expect(rows[0]).toMatchObject({ weekday: "Tue", experiment: "QV" });
  });

  it("is empty for a period before the test, or after today", async () => {
    answer = (sql) => (sql.includes("GROUP BY 1, 2, 7") ? [{ key: "qv", vid: 0, vname: "C", vvalue: "", flag: "f", ename: "QV", day: "2026-10-27", people: 1 }] : []);
    expect(await loadReportRows("qv", new Date(2026, 8, 1), new Date(2026, 8, 30), NOW)).toEqual([]);
    expect(await loadReportRows("qv", new Date(2026, 10, 1), new Date(2026, 10, 5), NOW)).toEqual([]);
  });
});

describe("events", () => {
  it("shapes each table's rows, newest first, with the product name filled in", async () => {
    const at = (s: string) => new Date(s);
    let n = 0;
    const tables: unknown[][] = [
      [{ id: "e1", anonymousId: "v1", createdAt: at("2026-10-29T09:00:00Z"), experimentKey: "qv", experimentName: "QV", variationId: 1, variationName: "Treatment", variationValue: "true", featureId: "f" }],
      [{ id: "c1", anonymousId: "v1", createdAt: at("2026-10-29T09:02:00Z"), productId: "p1", productName: "Watch", slug: "watch", brand: "B", price: 520, quantity: 1, selectedSize: null, selectedColor: "Black" }],
      [{ id: "q1", anonymousId: "v1", createdAt: at("2026-10-29T09:01:00Z"), customerId: null, productId: "p1", pname: "Watch", featureKey: "quick-view-enabled", featureEnabled: true, experimentKey: "qv", variationId: 1 }],
      [],
      [{ id: "w1", anonymousId: "v2", createdAt: at("2026-10-29T08:00:00Z"), experimentKey: "new", variationId: 0, variationName: "Plain", variationValue: "0" }],
      [{ id: "t1", anonymousId: "v2", createdAt: at("2026-10-29T08:30:00Z"), theme: "dark" }],
    ];
    answer = () => tables[n++] ?? [];
    const events = await loadEvents();
    expect(events.map((e) => e.event)).toEqual(["add_to_cart", "quick_view_clicked", "experiment_exposure", "theme_toggle", "whats_new_clicked"]);
    expect(events.map((e) => e.id)).toEqual([1, 2, 3, 4, 5]);
    const cart = events[0];
    expect(cart).toMatchObject({ product: "Watch", table: "add_to_cart_tracking", colour: "Black", price: 520, visitor: "v1" });
    expect(cart.props.price).toBe("520.00");
    expect(cart.props.selectedSize).toBeNull();
    expect(events[1].product).toBe("Watch");
    expect(JSON.stringify(events)).not.toMatch(BAD);
  });
});

describe("products", () => {
  it("keeps the five busiest products and turns the JSON text into lists", async () => {
    const row = (name: string, atc: number, qv = 0) => ({ id: name, name, slug: name, brand: "B", price: 10, sizes: '["S","M"]', colors: "oops", cat: "Fashion", qv: qv, atc: atc, yday: 0 });
    let n = 0;
    const results: unknown[][] = [
      [row("A Alpha", 3), row("B Beta", 9), row("C Gamma", 0), row("D Delta", 5, 2), row("E", 1), row("F", 2), row("G", 4)],
      [{ name: "Fashion", n: 24 }],
      [{ name: "Black", n: 5 }, { name: "Mystery", n: 1 }],
      [{ n: 7 }],
      [{ n: 3 }],
    ];
    answer = () => results[n++] ?? [];
    const p = await loadProducts(NOW);
    expect(p.products.map((x) => x.name)).toEqual(["B Beta", "D Delta", "G", "A Alpha", "F"]);
    expect(p.products[0]).toMatchObject({ short: "BB", views: 0, opts: ["S", "M"], cols: [] });
    expect(p.cats).toEqual([["Fashion", 24]]);
    expect(p.colours).toEqual([["Black", 5, "#16181d"], ["Mystery", 1, "#9aa0ad"]]);
    expect(p.qv).toMatchObject({ opened: 7, add: 3, seen: 0, extrasTracked: false });
    expect(p.viewsTracked).toBe(false);
  });

  it("reads JSON lists safely", () => {
    expect(jsonList('["a","b"]')).toEqual(["a", "b"]);
    expect(jsonList('[1,"a"]')).toEqual(["a"]);
    for (const bad of [null, "", "nope", '{"a":1}']) expect(jsonList(bad)).toEqual([]);
  });
});

describe("overview", () => {
  it("counts per day in the store's time zone and compares with the week before", async () => {
    answer = (sql) => {
      if (sql.includes("SELECT src, day, COUNT(*)")) return [{ src: "add_to_cart", day: "2026-10-28", n: 4 }, { src: "add_to_cart", day: "2026-10-20", n: 2 }, { src: "theme_toggle", day: "2026-10-29", n: 1 }];
      if (sql.includes("SELECT DISTINCT aid, day")) return [{ aid: "a", day: "2026-10-28" }, { aid: "b", day: "2026-10-28" }, { aid: "a", day: "2026-10-29" }, { aid: "c", day: "2026-10-20" }];
      return [];
    };
    const o = await loadOverview(NOW);
    expect(o.days).toEqual(["Oct 23", "Oct 24", "Oct 25", "Oct 26", "Oct 27", "Oct 28", "Oct 29"]);
    expect(o.addToCarts).toEqual([0, 0, 0, 0, 0, 4, 0]);
    expect(o.addToCartsPrevWeek).toBe(2);
    expect(o.visitors).toEqual([0, 0, 0, 0, 0, 2, 1]);
    expect(o.visitorsPrevWeek).toBe(1);
    expect(o.daily.theme_toggle.at(-1)).toBe(1);
  });
});

describe("store card", () => {
  it("covers STORE_REFRESH_MINUTES, and says exactly which window it is", async () => {
    minutes = 45;
    const s = await loadStoreLast30(NOW);
    expect(s.minutes).toBe(45);
    expect(s.to - s.from).toBe(45 * 60_000);
    expect(s.to).toBe(NOW.getTime());
    expect(s.exposures).toBe(0);
  });

  it("counts people at each stop, exposures and per-minute people with empty minutes as 0", async () => {
    answer = (sql, values) => {
      if (sql.includes("GROUP BY 1, 2, 7")) return [{ key: "qv", vid: 0, vname: "C", vvalue: "false", flag: "f", ename: "QV", day: "2026-10-29", people: 5 }];
      if (sql.includes("FLOOR(EXTRACT(EPOCH")) return [{ key: "qv", vid: 0, ago: 2, people: 3 }, { key: "qv", vid: 1, ago: 0, people: 1 }];
      if (sql.includes("SELECT src, aid")) return [{ src: "add_to_cart", aid: "a" }, { src: "add_to_cart", aid: "a" }, { src: "add_to_cart", aid: "b" }, { src: "theme_toggle", aid: "c" }];
      if (sql.includes("COUNT(DISTINCT aid)")) return [{ n: 3 }];
      if (sql.includes("FROM experiment_tracking WHERE \"createdAt\" >=") && !sql.includes("GROUP")) return [{ n: 4 }];
      return values.length ? [] : [];
    };
    minutes = 5;
    const s = await loadStoreLast30(NOW);
    expect(s.visitors).toBe(3);
    expect(s.exposures).toBe(4);
    expect(Object.fromEntries(s.zones.map((z) => [z.k, z.n]))).toEqual({ whatsnew: 0, browse: 0, theme: 1, quick: 0, cart: 2 });
    expect(s.recent.qv.mins).toEqual([0, 0, 3, 0, 1]);
    expect(s.recent.qv.c[0]).toBe(3);
    expect(s.recent.qv.t[0]).toBe(1);
    expect(JSON.stringify(s)).not.toMatch(BAD);
  });
});

describe("event detail", () => {
  const at = (s: string) => new Date(s);
  const cart = (id: string, when: string) => ({ id, anonymousId: "v1", createdAt: at(when), productId: "p1", productName: "Watch", slug: "w", brand: "B", price: 520, quantity: 1, selectedSize: null, selectedColor: null });

  it("is null when there is no such row in that table", async () => {
    expect(await loadEventDetail("add_to_cart_tracking", "nope")).toBeNull();
  });

  it("returns the stored row and the visitor's journey, oldest first", async () => {
    const target = cart("c2", "2026-10-29T09:02:00Z");
    answer = (sql, values) => {
      const idFilter = values.includes("c2") && !sql.includes("COUNT(*)");
      if (sql.includes("FROM add_to_cart_tracking\n      WHERE")) return idFilter && values.length < 8 ? [target] : [target, cart("c1", "2026-10-29T09:00:00Z")];
      if (sql.includes("SUM(n)")) return [{ n: 2 }];
      if (sql.includes("row_to_json")) return [{ row: '{"id":"c2","anonymousId":"v1","createdAt":"2026-10-29T09:02:00"}' }];
      return [];
    };
    const d = await loadEventDetail("add_to_cart_tracking", "c2");
    expect(d?.event).toMatchObject({ rowId: "c2", table: "add_to_cart_tracking", product: "Watch" });
    expect(d?.row).toEqual({ id: "c2", anonymousId: "v1", createdAt: "2026-10-29T09:02:00Z" });
    expect(Object.keys(d?.row ?? {})).toEqual(["id", "anonymousId", "createdAt"]);
    expect(d?.journey.steps.map((s) => s.rowId)).toEqual(["c1", "c2"]);
    expect(d?.journey.earlier).toBe(0);
  });

  it("shows at most 100 steps and counts the earlier ones", async () => {
    const many = Array.from({ length: JOURNEY_MAX + 1 }, (_, i) => cart(`c${i}`, new Date(Date.UTC(2026, 9, 29, 0, i)).toISOString()));
    const target = many[many.length - 1];
    answer = (sql, values) => {
      if (sql.includes("FROM add_to_cart_tracking\n      WHERE")) return values.includes(target.id) && values.length < 8 ? [target] : many.slice().reverse();
      if (sql.includes("SUM(n)")) return [{ n: 130 }];
      if (sql.includes("row_to_json")) return [{ row: "{}" }];
      return [];
    };
    const d = await loadEventDetail("add_to_cart_tracking", target.id);
    expect(d?.journey.steps).toHaveLength(JOURNEY_MAX);
    expect(d?.journey.earlier).toBe(30);
    expect(d?.journey.steps.at(-1)?.rowId).toBe(target.id);
  });

  it("sends the six table names as written SQL and nothing that writes", async () => {
    answer = () => [];
    await loadEventDetail("whats_new_tracking", "x");
    expect(sent.every((s) => !/\b(DELETE|INSERT|UPDATE|DROP|ALTER|TRUNCATE)\b/i.test(s))).toBe(true);
  });
});
