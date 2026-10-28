import type { AnalyticsEvent, EventType } from "@/types";

/** Where each event's variant comes from. */
export type VariantSource = "yes" | "no" | "hardcoded" | "stored";

export const VARIANT_SOURCE: Record<EventType, VariantSource> = {
  experiment_exposure: "yes",
  add_to_cart: "no",
  quick_view_clicked: "hardcoded",
  quick_view_cart: "no",
  whats_new_clicked: "stored",
  theme_toggle: "no",
};

/** The tracking table each kind of event is written to. */
export const EVENT_TABLE: Record<EventType, string> = {
  experiment_exposure: "experiment_tracking",
  add_to_cart: "add_to_cart_tracking",
  quick_view_clicked: "quickview_tracking",
  quick_view_cart: "quick_view_cart_events",
  whats_new_clicked: "whats_new_tracking",
  theme_toggle: "theme_toggle_tracking",
};

/** One row exactly as stored in its table: id, anonymousId, the table's own columns, createdAt. */
export function storedRow(e: AnalyticsEvent): Record<string, string | number | boolean | null> {
  return { id: e.rowId, anonymousId: e.visitor, ...e.props, createdAt: Number.isFinite(e.ts) ? new Date(e.ts).toISOString() : "" };
}

/** [headline, detail] for one step of the visitor journey. */
export function journeyText(e: AnalyticsEvent): [string, string] {
  const product = e.product ?? "a product";
  if (e.event === "experiment_exposure") return [`Saw “${e.variationName ?? "a variant"}”`, String(e.props.experimentName ?? "")];
  if (e.event === "quick_view_clicked") return ["Opened quick view", product];
  if (e.event === "theme_toggle") return [`Switched to ${e.theme ?? "another"} mode`, ""];
  if (e.event === "add_to_cart") {
    const price = e.price === undefined ? "" : ` · £${e.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    return [`Added ${product} to cart`, `${e.size ?? "—"} · ${e.colour ?? "—"}${price} · qty ${e.props.quantity ?? 1}`];
  }
  if (e.event === "quick_view_cart") return ["Added to cart from quick view", product];
  return ["Clicked “What’s new”", `Saw “${e.variationName ?? "a variant"}”`];
}

/** All of one visitor's events, oldest first. */
export const journeyOf = (events: AnalyticsEvent[], visitor: string): AnalyticsEvent[] => events.filter((x) => x.visitor === visitor).sort((a, b) => a.ts - b.ts);
