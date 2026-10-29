import type { ExperimentPreview } from "@/types";

/** The tracking table an experiment's goal is counted from. A fixed list: table names in SQL come from here. */
export type MetricTable = "add_to_cart_tracking" | "whats_new_tracking" | "theme_toggle_tracking";

export type ExperimentSetup = {
  metricTable: MetricTable;
  /** "Added to cart (add_to_cart_tracking)" */
  metric: string;
  /** "added to cart" in "10% of people added to cart". */
  verb: string;
  /** "add-to-cart rate" */
  metricShort: string;
  preview: ExperimentPreview;
};

const ADD_TO_CART: ExperimentSetup = { metricTable: "add_to_cart_tracking", metric: "Added to cart (add_to_cart_tracking)", verb: "added to cart", metricShort: "add-to-cart rate", preview: "button" };

/** What Insights counts as success for each test, by experiment key. Tests not listed here count add-to-carts. */
const SETUPS: Record<string, ExperimentSetup> = {
  "add-to-cart": ADD_TO_CART,
  "quick-view-ab-test": { ...ADD_TO_CART, preview: "quick" },
  "new-ab-test": { metricTable: "whats_new_tracking", metric: "Clicked What’s New (whats_new_tracking)", verb: "clicked What’s New", metricShort: "What’s New click rate", preview: "whatsnew" },
  "whats-new-ab-test": { metricTable: "whats_new_tracking", metric: "Clicked What’s New (whats_new_tracking)", verb: "clicked What’s New", metricShort: "What’s New click rate", preview: "whatsnew" },
  "add-cart-button-experience": ADD_TO_CART,
  "add-cart-button-experience-ga4": ADD_TO_CART,
  "quick-view-style": { ...ADD_TO_CART, preview: "quick" },
  "quick-view-enabled-ga4": { ...ADD_TO_CART, preview: "quick" },
  "theme-toggle": { metricTable: "theme_toggle_tracking", metric: "Switched theme (theme_toggle_tracking)", verb: "used the theme toggle", metricShort: "theme toggle rate", preview: "theme" },
  "theme-toggle-ab-test": { metricTable: "theme_toggle_tracking", metric: "Switched theme (theme_toggle_tracking)", verb: "used the theme toggle", metricShort: "theme toggle rate", preview: "theme" },
};

export const setupFor = (key: string): ExperimentSetup => SETUPS[key] ?? ADD_TO_CART;

/** Tests named one by one that the dashboard leaves out everywhere. */
const HIDDEN_KEYS = new Set(["quick-view-style"]);

/** Tests the dashboard leaves out everywhere: the ones listed above, and the GA4 copies, whose keys end in "-ga4". */
export const isHiddenExperiment = (key: string): boolean => {
  const k = key.toLowerCase();
  return HIDDEN_KEYS.has(k) || k.endsWith("-ga4");
};
