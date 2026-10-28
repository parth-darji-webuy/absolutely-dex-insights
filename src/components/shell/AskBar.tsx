"use client";

import { Icon } from "@/components/Icon";
import { usePalette } from "./PaletteProvider";

/** The wide search box in the header. It opens the ⌘K palette. */
export function AskBar() {
  const { show } = usePalette();
  return (
    <button type="button" className="askbar" onClick={show} title="Search or ask (⌘K)">
      <Icon name="search" />
      <span className="long">Search pages and experiments, or ask about your data…</span>
      <span className="short">Search or ask…</span>
      <kbd>⌘K</kbd>
    </button>
  );
}
