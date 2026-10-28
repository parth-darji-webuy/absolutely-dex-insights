import type { IconName } from "@/components/Icon";
import { PAGES } from "./nav";

export type PaletteItem = {
  group: "Ask AI" | "Suggested questions" | "Go to" | "Experiments";
  label: string;
  icon: IconName;
  hint?: string;
  /** Extra words the search matches against. */
  find?: string;
  href: string;
};

export type PaletteExperiment = { key: string; name: string; desc: string; status: string };

const askHref = (q: string) => `/ask?q=${encodeURIComponent(q.trim())}`;

/** What the ⌘K list shows for a search: ask, suggested questions, pages, then experiments. */
export function paletteItems(query: string, experiments: PaletteExperiment[], suggestions: string[]): PaletteItem[] {
  const q = query.trim().toLowerCase();
  const ask: PaletteItem[] = q ? [{ group: "Ask AI", label: `Ask: “${query.trim()}”`, icon: "spark", hint: "↵", href: askHref(query) }] : [];
  const pages: PaletteItem[] = [...PAGES, { id: "ask", label: "Ask your data", icon: "spark" as IconName }].map((p) => ({
    group: "Go to",
    label: p.label,
    icon: p.icon,
    href: `/${p.id}`,
  }));
  const exps: PaletteItem[] = experiments.map((e) => ({
    group: "Experiments",
    label: e.name,
    icon: "flask",
    hint: e.status,
    find: `${e.desc} ${e.key}`,
    href: `/experiments/${e.key}`,
  }));
  const sugg: PaletteItem[] = suggestions.map((s) => ({ group: "Suggested questions", label: s, icon: "search", href: askHref(s) }));
  const match = (it: PaletteItem) => !q || it.label.toLowerCase().includes(q) || (it.hint ?? "").toLowerCase().includes(q) || (it.find ?? "").toLowerCase().includes(q);
  return [...ask, ...(q ? [] : sugg), ...pages.filter(match), ...exps.filter(match), ...(q ? sugg.filter(match) : [])];
}
