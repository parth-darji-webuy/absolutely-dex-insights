import type { ReactNode } from "react";

/** A row of small labelled boxes: label on top, number underneath. */
export function KvGrid({ items, className = "" }: { items: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <div className={`grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2.5 ${className}`}>
      {items.map(([k, v], i) => (
        <div key={i} className="rounded-[9px] border border-border bg-card2 px-3 py-2.5">
          <span className="block text-xs text-text3">{k}</span>
          <b className="text-[15px] font-semibold tabular-nums">{v}</b>
        </div>
      ))}
    </div>
  );
}
