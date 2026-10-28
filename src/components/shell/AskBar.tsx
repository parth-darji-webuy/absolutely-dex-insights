"use client";

import { Icon } from "@/components/Icon";
import { usePalette } from "./PaletteProvider";

/** The wide search box in the header. It opens the ⌘K palette. */
export function AskBar() {
  const { show, aiEnabled } = usePalette();
  return (
    <button type="button" className="askbar" onClick={show} title={aiEnabled ? "Search or ask (⌘K)" : "Search (⌘K)"}>
      <Icon name="search" />
      <span className="long">{aiEnabled ? "Search pages and experiments, or ask about your data…" : "Search pages and experiments…"}</span>
      <span className="short">{aiEnabled ? "Search or ask…" : "Search…"}</span>
      <kbd>⌘K</kbd>
    </button>
  );
}
