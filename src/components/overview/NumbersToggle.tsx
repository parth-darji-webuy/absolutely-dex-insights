"use client";

import { type ReactNode, useId, useState } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";

/** The summary line, its "Show the numbers" link, and the numbers that open underneath. */
export function SummaryBody({ line, numbers }: { line: ReactNode; numbers: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="min-w-0 flex-1">
      <div className="text-[15px] font-[550] tracking-[-.005em]">{line}</div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-text3">
        <span className="inline-flex h-[22px] items-center gap-[5px] rounded-md border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-accent-soft px-2 text-[11.5px] font-[550] text-accent-text">
          <Icon name="spark" size="sm" /> Summary
        </span>
        <span>Written from the numbers below, no AI</span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[13px] font-medium text-accent-text hover:underline hover:underline-offset-[3px]"
        >
          {open ? "Hide the numbers" : "Show the numbers"} <Icon name="chev" size="sm" className={cn("transition-transform duration-200", open && "rotate-180")} />
        </button>
      </div>
      <div id={id} hidden={!open} className="fade mt-3 border-t border-border pt-3">
        {numbers}
      </div>
    </div>
  );
}
