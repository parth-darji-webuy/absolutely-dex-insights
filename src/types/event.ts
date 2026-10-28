export type EventType =
  | "experiment_exposure"
  | "add_to_cart"
  | "quick_view_clicked"
  | "theme_toggle"
  | "whats_new_clicked"
  | "quick_view_cart";

export type EventMeta = { label: string; short: string; c: string };

export type IdKind = "uuid" | "cuid";

/** Where an event is written, whether the row knows its variant, and its id type. */
export type EventSchema = {
  table: string;
  variation: "yes" | "no" | "hardcoded" | "stored";
  id: IdKind;
};

export type EventProps = Record<string, string | number | boolean | null>;

export type AnalyticsEvent = {
  id: number;
  rowId: string;
  ts: number;
  event: EventType;
  visitor: string;
  env: "production";
  table: string;
  product: string | null;
  props: EventProps;
  size?: string;
  colour?: string;
  price?: number;
  theme?: string;
  experimentKey?: string;
  variationName?: string;
};

/** Events in each of the last 60 minutes, split by type, oldest first. */
export type EventsPerMinute = {
  /** "−59m" … "now" */
  labels: string[];
  series: { key: EventType; name: string; color: string; values: number[] }[];
};

/** One event row in full: the row as stored, and the visitor's journey around it. */
export type EventDetail = {
  event: AnalyticsEvent;
  /** Every column of the row, as the table holds it. */
  row: Record<string, unknown>;
  journey: {
    /** Oldest first. */
    steps: AnalyticsEvent[];
    /** How many older steps are not shown. */
    earlier: number;
  };
};
