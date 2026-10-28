import type { EventMeta, EventType } from "@/types";

export const DAYS = ["Oct 10", "Oct 11", "Oct 12", "Oct 13", "Oct 14", "Oct 15", "Oct 16"];
export const VIS = [1650, 1700, 1760, 1790, 1820, 1850, 1910]; // 12,480 this week
export const VIS_PREV = 11620;
export const ATC = [178, 186, 195, 204, 212, 214, 227]; // 1,416 this week

export const EVT_META: Record<EventType, EventMeta> = {
  experiment_exposure: { label: "Saw an experiment", short: "Experiment view", c: "var(--c1)" },
  add_to_cart: { label: "Add to cart", short: "Add to cart", c: "var(--c2)" },
  quick_view_clicked: { label: "Quick view", short: "Quick view", c: "var(--c3)" },
  theme_toggle: { label: "Theme toggle", short: "Theme toggle", c: "var(--c4)" },
  whats_new_clicked: { label: "What's new", short: "What's new", c: "var(--c5)" },
  quick_view_cart: { label: "Added from quick view", short: "Quick view cart", c: "var(--c6)" },
};

export const DAILY: Record<EventType, number[]> = {
  experiment_exposure: [880, 900, 930, 950, 960, 980, 1000],
  add_to_cart: ATC,
  quick_view_clicked: [240, 252, 262, 268, 276, 282, 292], // 1,872 (matches funnel)
  theme_toggle: [62, 58, 71, 66, 74, 69, 80],
  whats_new_clicked: [34, 41, 38, 29, 45, 40, 37],
  quick_view_cart: [49, 52, 54, 57, 59, 60, 62], // 393: add-to-carts made from quick view
};
