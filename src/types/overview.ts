import type { EventMeta, EventType } from "./event";
import type { RecentWindow } from "./experiment";

export type Overview = {
  days: string[];
  visitors: number[];
  visitorsPrevWeek: number;
  addToCarts: number[];
  eventMeta: Record<EventType, EventMeta>;
  daily: Record<EventType, number[]>;
};

export type ZoneKey = "whatsnew" | "browse" | "theme" | "quick" | "cart";
export type WalkerProp = "" | "phone" | "glass" | "bag";

export type Zone = { k: ZoneKey; x: number; icon: "spark" | "search" | "moonS" | "eye" | "bag"; label: string; n: number };
/** A visitor standing at a stop. `seed` only drives how the figure looks; it is never shown. */
export type IdleVisitor = { zone: ZoneKey; x: number; prop: WalkerProp; seed: string };

export type StoreLast30 = {
  minutes: number;
  visitors: number;
  zones: Zone[];
  idle: IdleVisitor[];
  recent: Record<string, RecentWindow>;
};
