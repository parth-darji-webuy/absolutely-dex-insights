import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AnswerCard } from "@/components/ask/AnswerCard";
import { EventsTable } from "@/components/events/EventsTable";
import { ReportsPanel } from "@/components/reports/ReportsPanel";
import { QuickViewReplica } from "@/components/site/QuickViewReplica";
import { ANSWERS, EVT_META, generateEvents, QV } from "@/mocks";
import { CategoriesCard, ColoursCard, FunnelCard, HeatGridCard, InterestCard } from "./products/ProductCards";
import { EventMixCard, PerMinuteCard } from "./events/EventCards";

// The cards read through @/lib/data; here it hands out the prototype's sample data so the markup can be checked.
const state = vi.hoisted(() => ({ products: null as null | import("@/types").ProductsData }));
vi.mock("@/lib/data", async () => {
  const m = await import("@/mocks");
  const sample = { products: m.PRODUCTS, cats: m.CATS, colours: m.COLOURS, qv: m.QV, viewsTracked: true };
  const overview = { days: m.DAYS, visitors: m.VIS, visitorsPrevWeek: m.VIS_PREV, addToCarts: m.ATC, addToCartsPrevWeek: m.ATC_PREV, flagCounts: m.FLAG_COUNTS, runningCounts: m.RUNNING_COUNTS, sources: m.SOURCES, devices: m.DEVICES, eventMeta: m.EVT_META, daily: m.DAILY };
  return { getProducts: async () => state.products ?? sample, getOverview: async () => overview, getEvents: async () => m.generateEvents(), getEventsPerMinute: async () => m.generateEventsPerMinute(), getExperiments: async () => m.EXPS, getExperiment: async () => null, getStoreLast30: async () => null, getReportRows: async () => [] };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {}, replace() {} }) }));

const BAD = /NaN|undefined|Infinity|>null</;
const html = (el: React.ReactElement) => renderToStaticMarkup(el);
const ZERO = { seen: 0, btn: 0, eye: 0, opened: 0, heartCard: 0, add: 0, detail: 0, wish: 0, closed: 0, extrasTracked: true };

describe("Events page", () => {
  it("lists the latest 40 events with an 'ago' next to each time", () => {
    const m = html(<EventsTable events={generateEvents()} meta={EVT_META} qv={QV} weekLabel="Oct 10 – 16" />);
    expect(m.match(/<tr class="click"/g)).toHaveLength(40);
    expect(m).toMatch(/\d+s ago/);
    expect(m).not.toMatch(BAD);
  });

  it("shows the empty state when there are no events", () => {
    const m = html(<EventsTable events={[]} meta={EVT_META} qv={QV} weekLabel="" />);
    expect(m).toContain("No events yet");
    expect(m).not.toMatch(BAD);
  });

  it("draws the per-minute chart and the mix without NaN", async () => {
    const [a, b] = await Promise.all([PerMinuteCard(), EventMixCard()]);
    expect(html(a)).toContain("529 events");
    expect(html(b)).toContain("Event mix");
    expect(html(a) + html(b)).not.toMatch(BAD);
  });
});

describe("Products page", () => {
  it("renders every card with the prototype's wording and no NaN", async () => {
    const cards = await Promise.all([InterestCard(), HeatGridCard(), FunnelCard(), CategoriesCard(), ColoursCard()]);
    const m = cards.map((c) => html(c)).join("");
    expect(m).not.toMatch(BAD);
    expect(m).toContain("Viewed a lot, rarely added to cart");
    expect(m).toContain("<b>Linea Relaxed Linen Overshirt</b></span><span> and <b>the Aperture R4 camera</b>");
    expect(m).toContain("3,120 and 2,860) but only 6.9% and 6.2% of viewers add them to cart, vs 9.9% across all five.");
    expect(m).toContain("biggest drop-off");
    expect(m).toContain("Share of 1,416 add-to-carts");
  });

  it("the quick view replica shows zeros and dashes, never NaN, when nobody opened it", () => {
    const m = html(<QuickViewReplica qv={ZERO} heat />);
    expect(m).not.toMatch(BAD);
    expect(m).toContain("—");
  });

  it("with views and extra clicks untracked, the pages say so instead of showing zeros", async () => {
    const untracked = { products: [], cats: [], colours: [], qv: { ...ZERO, opened: 20, add: 5, extrasTracked: false }, viewsTracked: false };
    state.products = untracked;
    const m = (await Promise.all([InterestCard(), HeatGridCard(), FunnelCard()])).map((c) => html(c)).join("");
    state.products = null;
    expect(m).not.toMatch(BAD);
    expect(m).toContain("The store doesn’t record product views yet");
    expect(m).toContain("No product activity this week");
    expect(m).toContain("Button views not tracked yet");
    expect(m).not.toContain("Saw quick view button");
    expect(m).toContain("25.0% continued");
    const modal = html(<QuickViewReplica qv={untracked.qv} heat />);
    expect(modal).not.toMatch(BAD);
    expect(modal.match(/class="hot/g)).toHaveLength(1); // only Add to Cart is tracked
  });

  it("the replica hides the numbers when click data is off", () => {
    expect(html(<QuickViewReplica qv={QV} heat={false} />)).toContain("heat-off");
  });
});

describe("Ask page", () => {
  const item = { id: 1, q: "How is the Buy Now test doing?" };
  it("shows thinking, the answer and the couldn't-match card", () => {
    expect(html(<AnswerCard item={{ ...item, state: "thinking" }} index={0} />)).toContain("Looking at your events…");
    const done = html(<AnswerCard item={{ ...item, state: "answer", answer: ANSWERS.buyNow, fresh: false }} index={0} />);
    expect(done).toContain("Show the query / numbers");
    expect(done).toContain("AI answer · Groq free plan");
    expect(done).toContain("94% sure");
    expect(done).not.toMatch(BAD);
    const none = html(<AnswerCard item={{ ...item, q: "weather?", state: "unknown" }} index={0} />);
    expect(none).toContain("I couldn&#x27;t match that to anything Insights tracks, so I won&#x27;t guess.");
    expect(none).toContain("theme_toggle_tracking");
  });
});

describe("Reports page", () => {
  it("shows the period card and a Download CSV button per experiment", () => {
    const exps = [{ key: "add-to-cart", name: "Add to Cart button text", flag: "add-to-cart-btn", metricShort: "added to cart", mtable: "add_to_cart_tracking", status: "Running", start: "Oct 6, 2026" }];
    const m = html(<ReportsPanel experiments={exps} today="2026-10-29" trackingStart="2026-09-01" />);
    expect(m).toContain("Period and experiment");
    expect(m).toContain("Last month");
    expect(m).toContain("Download CSV");
    expect(m).toContain("06 Oct 2026");
    expect(m).not.toMatch(BAD);
  });
});
