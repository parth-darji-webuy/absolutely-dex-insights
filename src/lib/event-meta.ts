import type { EventMeta, EventType } from "@/types";

/** The label, short label and colour of each kind of event. */
export const EVENT_META: Record<EventType, EventMeta> = {
  experiment_exposure: { label: "Saw an experiment", short: "Experiment view", c: "var(--c1)" },
  add_to_cart: { label: "Add to cart", short: "Add to cart", c: "var(--c2)" },
  quick_view_clicked: { label: "Quick view", short: "Quick view", c: "var(--c3)" },
  theme_toggle: { label: "Theme toggle", short: "Theme toggle", c: "var(--c4)" },
  whats_new_clicked: { label: "What's new", short: "What's new", c: "var(--c5)" },
  quick_view_cart: { label: "Added from quick view", short: "Quick view cart", c: "var(--c6)" },
};
