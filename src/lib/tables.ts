/** The store's six tracking tables. The fixed list that table names in queries come from. */
export const TRACKING_TABLES = [
  "experiment_tracking",
  "add_to_cart_tracking",
  "quickview_tracking",
  "quick_view_cart_events",
  "whats_new_tracking",
  "theme_toggle_tracking",
] as const;

export type TrackingTable = (typeof TRACKING_TABLES)[number];

/** True when `value` is exactly one of the six tracking tables. */
export const isTrackingTable = (value: unknown): value is TrackingTable => typeof value === "string" && (TRACKING_TABLES as readonly string[]).includes(value);
