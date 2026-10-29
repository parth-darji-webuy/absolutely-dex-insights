"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { buttonClasses } from "@/components/ui/button-styles";
import { usePalette } from "./PaletteProvider";

/** "Ask AI" in the header: goes to the Ask page. Not shown when the AI is switched off. */
export function AskAiButton() {
  const { aiEnabled } = usePalette();
  if (!aiEnabled) return null;
  return (
    <Link href="/ask" className={buttonClasses("primary", "md", false, "ask-ai")} title="Ask your data">
      <Icon name="spark" />
      <span>Ask AI</span>
    </Link>
  );
}
