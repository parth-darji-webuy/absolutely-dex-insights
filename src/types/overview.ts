import type { EventMeta, EventType } from "./event";
import type { RecentWindow } from "./experiment";

export type Overview = {
  days: string[];
  visitors: number[];
  visitorsPrevWeek: number;
  addToCarts: number[];
  /** Add-to-carts in the week before `days`. */
  addToCartsPrevWeek: number;
  /** Feature flags on and experiments running, per day of `days`. */
  flagCounts: number[];
  runningCounts: number[];
  /** Not tracked yet: needs a referrer column. */
  sources: { label: string; value: number }[];
  /** Not tracked yet: needs a device column. Visitors and add-to-carts per device. */
  devices: { label: string; visitors: number; addToCarts: number }[];
  eventMeta: Record<EventType, EventMeta>;
  daily: Record<EventType, number[]>;
};

export type ZoneKey = "whatsnew" | "browse" | "theme" | "quick" | "cart";
export type WalkerProp = "" | "phone" | "glass" | "bag";

export type Zone = { k: ZoneKey; x: number; icon: "spark" | "search" | "moonS" | "eye" | "bag"; label: string; n: number };
/** A visitor standing at a stop. `seed` only drives how the figure looks; it is never shown. */
export type IdleVisitor = { zone: ZoneKey; x: number; prop: WalkerProp; seed: string };

export type StoreLast30 = {
  /** How many minutes the window covers (STORE_REFRESH_MINUTES). */
  minutes: number;
  /** The window as milliseconds since 1970: worked out on the server when the numbers were read. */
  from: number;
  to: number;
  visitors: number;
  /** People who entered any test in the window, counted once per test. */
  exposures: number;
  zones: Zone[];
  idle: IdleVisitor[];
  recent: Record<string, RecentWindow>;
};
