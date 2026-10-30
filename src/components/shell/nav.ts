import type { IconName } from "@/components/Icon";

export type NavPage = { id: string; label: string; icon: IconName };

export const PAGES: NavPage[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "experiments", label: "Experiments", icon: "flask" },
  { id: "events", label: "Events", icon: "pulse" },
  { id: "products", label: "Products", icon: "bag" },
  { id: "reports", label: "Reports", icon: "report" },
];

/** The line under each page's heading. */
export const SUBS: Record<string, string> = {
  reports: "Daily results for every experiment. Pick the dates and the experiment, then download a CSV.",
};

export const TITLES: Record<string, string> = {
  overview: "Overview",
  experiments: "Experiments",
  events: "Events",
  products: "Products",
  reports: "Reports",
  ask: "Ask your data",
};
