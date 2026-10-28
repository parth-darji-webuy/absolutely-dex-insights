import { splitTotal } from "@/lib/dates";
import type { IdleVisitor, RecentWindow, Zone } from "@/types";

// Store scene: what people did in the last 30 minutes, stop by stop.
export const ZONES: Zone[] = [
  { k: "whatsnew", x: 10, icon: "spark", label: "opened What’s New", n: 3 },
  { k: "browse", x: 30, icon: "search", label: "browsed products", n: 41 },
  { k: "theme", x: 50, icon: "moonS", label: "switched theme", n: 3 },
  { k: "quick", x: 70, icon: "eye", label: "opened quick view", n: 9 },
  { k: "cart", x: 90, icon: "bag", label: "added to cart", n: 7 },
];

// a few of the people at each stop
export const IDLE: IdleVisitor[] = [
  { zone: "whatsnew", x: 14, prop: "phone", seed: "wE8bA3iUc6Ry" },
  { zone: "browse", x: 25, prop: "phone", seed: "Rb7nW3eYs0Qd" },
  { zone: "browse", x: 34, prop: "", seed: "pZ4cH8uVt2Lk" },
  { zone: "browse", x: 37, prop: "glass", seed: "Hq2vL9oPz4Mn" },
  { zone: "theme", x: 54, prop: "", seed: "Ta4kP8rWz2Qc" },
  { zone: "quick", x: 66, prop: "glass", seed: "Xm1fJ6gNq9Ea" },
  { zone: "quick", x: 74, prop: "phone", seed: "Vb3nE7yUo1Lp" },
  { zone: "cart", x: 94, prop: "bag", seed: "dS5yK0rTw7Bc" },
];

// LAST 30 MINUTES: people shown each test and conversions per variant (shown on Overview).
export const RECENT_MIN = 30;
export const RECENT_VISITORS = 58;

const RECENT_BASE: Record<string, Omit<RecentWindow, "mins">> = {
  "add-to-cart": { c: [25, 2], t: [24, 3] },
  "quick-view-ab-test": { c: [18, 2], t: [19, 2] },
  "whats-new-ab-test": { c: [22, 1], t: [21, 2] },
  "theme-toggle-ab-test": { c: [18, 1], t: [17, 1] },
};

export const RECENT: Record<string, RecentWindow> = Object.fromEntries(
  Object.entries(RECENT_BASE).map(([key, v], i) => [key, { ...v, mins: splitTotal(v.c[0] + v.t[0], RECENT_MIN, 30 + i) }]),
);
