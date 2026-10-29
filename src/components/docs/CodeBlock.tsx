"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/ui/Toast";

/** A command to copy. If the browser blocks copying, the text is still there to select. */
export function CodeBlock({ code }: { code: string }) {
  const { toast } = useToast();
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setDone(true);
      toast("Copied");
      setTimeout(() => setDone(false), 1600);
    } catch {
      toast("Couldn’t copy. Select the text instead", "warn");
    }
  }

  return (
    <div className="relative mt-2 rounded-lg border border-border bg-card2">
      <pre className="overflow-x-auto py-3 pr-12 pl-3.5 font-mono text-[12.5px] leading-[1.6] text-text">{code}</pre>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy command"
        className="absolute top-2 right-2 grid size-7 place-items-center rounded-md border border-border bg-card text-text2 transition-colors hover:bg-hover hover:text-text"
      >
        <Icon name={done ? "check" : "copy"} size="sm" />
      </button>
    </div>
  );
}
