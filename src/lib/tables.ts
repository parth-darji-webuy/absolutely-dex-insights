/** The store's six tracking tables. The fixed list that table names in queries come from. */
export const TRACKING_TABLES = [
  "experiment_tracking",
  "add_to_cart_tracking",
  "quickview_tracking",
  "quick_view_cart_events",
  "whats_new_tracking",
  "theme_toggle_tracking",
] as const;
