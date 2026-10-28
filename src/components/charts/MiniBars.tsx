"use client";

import type { ReactNode } from "react";
import { useTipProps } from "@/components/ui/Tooltip";
import { safe } from "./chart-utils";

function Bar({ height, tip }: { height: number; tip: ReactNode }) {
  const props = useTipProps(tip);
  return <i className="flex-1 rounded-t-[2px] bg-text3 opacity-55 transition-opacity duration-150 hover:opacity-100" style={{ height: `${height}%` }} {...props} />;
}

/** Small bars for "people per minute". */
export function MiniBars({ values, tips, dense }: { values: number[]; /** What the hover tip says for each bar, in the same order as `values`. */ tips: ReactNode[]; /** Shorter, tighter bars for small cards. */ dense?: boolean }) {
  const clean = values.map((v) => Math.max(0, safe(v)));
  const mx = Math.max(0, ...clean);
  return (
    <div className={`flex items-end ${dense ? "h-[34px] gap-px" : "h-12 gap-[3px]"}`}>
      {clean.map((v, i) => (
        <Bar key={i} height={mx > 0 ? Math.max(4, (v / mx) * 100) : 4} tip={tips[i] ?? null} />
      ))}
    </div>
  );
}
