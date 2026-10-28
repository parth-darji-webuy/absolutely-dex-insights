import { splitTotal } from "@/lib/dates";
import { rng } from "@/lib/rng";
import { DAILY_SPLIT } from "./split";
import type { Experiment, ExperimentSeed, LiftRange } from "@/types";

const SEEDS: ExperimentSeed[] = [
  {
    key: "add-to-cart", flag: "add-to-cart", values: ['"Add to Cart"', '"Buy Now"'], name: "Add to Cart button text", desc: "“Add to Cart” vs “Buy Now”", status: "Running", days: 11, start: "Oct 6, 2026", needed: 2600,
    c: { label: "Add to Cart", people: 1000, conv: 100 }, t: { label: "Buy Now", people: 1000, conv: 120 }, chance: 94, metric: "Added to cart (add_to_cart_tracking)",
    verdict: ["Treatment is probably winning.", "About 94% sure. Wait ~3 more days to be safe."], lead: true, preview: "button",
    series: { c: [8.9, 9.4, 9.8, 10.3, 10.1, 9.9, 10.2, 10.0, 9.9, 10.1, 10.0], t: [10.2, 11.6, 12.4, 11.9, 12.3, 12.1, 11.8, 12.2, 12.0, 11.9, 12.0] },
  },
  {
    key: "quick-view-ab-test", flag: "quick-view-enabled", values: ["false", "true"], name: "Quick view on product cards", desc: "No quick view vs “Quick view” button", status: "Running", days: 6, start: "Oct 11, 2026", needed: 4500,
    c: { label: "No quick view", people: 920, conv: 90 }, t: { label: "Quick view", people: 920, conv: 96 }, chance: 71, metric: "Added to cart (add_to_cart_tracking)",
    verdict: ["Too early to tell.", "Quick view is slightly ahead, but only about 71% sure. Roughly 2 more weeks of data needed."], lead: false, preview: "quick",
  },
  {
    key: "whats-new-ab-test", flag: "whats-new-highlight", values: ['"plain"', '"highlighted"'], name: "What’s New A/B Test", desc: "Plain “What’s New” link vs highlighted link with a NEW badge", status: "Running", days: 9, start: "Oct 8, 2026", needed: 3200,
    c: { label: "Plain link", people: 1320, conv: 53 }, t: { label: "Highlighted + NEW", people: 1320, conv: 79 }, chance: 97, metric: "Clicked What’s New (whats_new_tracking)", verb: "clicked What’s New", metricShort: "What’s New click rate",
    verdict: ["Highlighted link is winning.", "About 97% sure. Wait ~2 more days to reach 3,200 people, then ship it."], lead: true, preview: "whatsnew",
  },
  {
    key: "theme-toggle-ab-test", flag: "theme-toggle-label", values: ['"icon"', '"icon+label"'], name: "Theme toggle label", desc: "Moon icon only vs icon with a “Dark mode” label", status: "Running", days: 8, start: "Oct 9, 2026", needed: 3000,
    c: { label: "Icon only", people: 1050, conv: 42 }, t: { label: "Icon + Dark mode label", people: 1050, conv: 58 }, chance: 88, metric: "Switched theme (theme_toggle_tracking)", verb: "used the theme toggle", metricShort: "theme toggle rate",
    verdict: ["The label probably helps.", "About 88% sure. Roughly 4 more days of data needed."], lead: false, preview: "theme",
  },
];

const LIFT_CI: Record<string, LiftRange> = {
  "add-to-cart": [-3, 45],
  "quick-view-ab-test": [-14, 31],
  "whats-new-ab-test": [6, 98],
  "theme-toggle-ab-test": [-11, 95],
};

const METRIC_TABLE: Record<string, string> = {
  "add-to-cart": "add_to_cart_tracking",
  "quick-view-ab-test": "add_to_cart_tracking",
  "whats-new-ab-test": "whats_new_tracking",
  "theme-toggle-ab-test": "theme_toggle_tracking",
};

function withDerived(seed: ExperimentSeed): Experiment {
  const people = seed.c.people + seed.t.people;
  const rc = seed.c.people ? (seed.c.conv / seed.c.people) * 100 : 0;
  const rt = seed.t.people ? (seed.t.conv / seed.t.people) * 100 : 0;
  let series = seed.series;
  if (!series) {
    // gentle synthetic history that ends on the real rates
    const r = rng(seed.key.length * 97);
    const n = Math.min(seed.days, 14);
    const mk = (end: number) =>
      Array.from({ length: n }, (_, i) => +(end + (r() - 0.5) * 2.4 * (1 - i / n)).toFixed(1)).map((v, i, a) =>
        i === a.length - 1 ? +end.toFixed(1) : v,
      );
    series = { c: mk(rc), t: mk(rt) };
  }
  return {
    ...seed,
    verb: seed.verb ?? "added to cart",
    metricShort: seed.metricShort ?? "add-to-cart rate",
    series,
    daily: DAILY_SPLIT[seed.key] ?? { c: splitTotal(seed.c.people, series.c.length, seed.key.length), t: splitTotal(seed.t.people, series.c.length, seed.key.length + 3) },
    mtable: METRIC_TABLE[seed.key] ?? "",
    liftCi: LIFT_CI[seed.key] ?? [-10, 10],
    people,
    rc,
    rt,
    lift: rc ? (rt / rc - 1) * 100 : 0,
    progress: Math.min(100, Math.round((people / seed.needed) * 100)),
  };
}

export const EXPS: Experiment[] = SEEDS.map(withDerived);
export const EBY: Record<string, Experiment> = Object.fromEntries(EXPS.map((e) => [e.key, e]));

/** Day each test started (October), used for chart labels. */
export const START_DAY: Record<string, number> = { "add-to-cart": 6, "quick-view-ab-test": 11, "whats-new-ab-test": 8, "theme-toggle-ab-test": 9 };
