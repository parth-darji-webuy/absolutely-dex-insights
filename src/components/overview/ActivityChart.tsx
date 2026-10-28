"use client";

import { useState } from "react";
import { type AreaSeries, AreaChart } from "@/components/charts";
import { cn } from "@/lib/cn";

/** The legend (click a name to hide that line) and the stacked chart under it. */
export function ActivityChart({ labels, series }: { labels: string[]; series: AreaSeries[] }) {
  const [off, setOff] = useState<string[]>([]);
  const toggle = (key: string) => setOff((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key]));
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {series.map((s) => {
          const hidden = off.includes(s.key);
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={!hidden}
              onClick={() => toggle(s.key)}
              className={cn(
                "inline-flex h-[26px] cursor-pointer items-center gap-1.5 rounded-[7px] border border-transparent bg-transparent px-[9px] text-xs text-text2 hover:bg-hover",
                hidden && "line-through opacity-45",
              )}
            >
              <i className="size-2 rounded-[2px]" style={hidden ? { border: `1.5px solid ${s.color}` } : { background: s.color }} />
              {s.name}
            </button>
          );
        })}
      </div>
      <div className="mt-3">
        <AreaChart labels={labels} series={series} stacked hidden={off} label="Activity over time" />
      </div>
    </>
  );
}
