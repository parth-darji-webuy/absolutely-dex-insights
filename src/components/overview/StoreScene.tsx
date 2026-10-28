"use client";

import { Icon } from "@/components/Icon";
import { lookOf } from "@/components/people/look";
import { Person } from "@/components/people/Person";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import type { StoreLast30 } from "@/types";

/** The store with its five stops, the count at each, and a few of the people standing there. */
export function StoreScene({ zones, idle, minutes }: Pick<StoreLast30, "zones" | "idle"> & { minutes: number }) {
  return (
    <>
      <div className="relative h-[230px] overflow-hidden rounded-[10px] border border-border bg-[linear-gradient(180deg,#F3F0FE_0%,#FAFAFD_72%)]">
        <div className="absolute inset-x-0 bottom-0 h-10 border-t border-border bg-[#EDEFF5]" />
        <div className="absolute right-[3%] bottom-[19px] left-[3%] border-t-2 border-dashed border-[#D3D6E2]" />
        {zones.map((z) => (
          <div
            key={z.k}
            className="absolute top-3.5 w-[112px] -translate-x-1/2 text-center text-[11px] leading-[1.3] text-text2 max-[1100px]:w-[90px] max-[1100px]:text-[10px] max-[560px]:w-[19%] max-[560px]:text-[9.5px] max-[560px]:leading-[1.25]"
            style={{ left: `${z.x}%` }}
          >
            <div className="mx-auto mb-1.5 grid size-10 place-items-center rounded-[11px] border border-border bg-white text-accent shadow-[0_1px_2px_rgba(16,24,40,.05)] max-[1100px]:size-[34px] max-[560px]:size-[30px] max-[560px]:rounded-[9px]">
              <Icon name={z.icon} />
            </div>
            <b className="block text-[17px] leading-[1.2] font-semibold text-text tabular-nums max-[560px]:text-[15px]">{fmt(z.n)}</b>
            {z.label}
          </div>
        ))}
        {idle.map((v, i) => {
          const label = zones.find((z) => z.k === v.zone)?.label;
          return (
            <div
              key={`${v.seed}-${i}`}
              className={cn("absolute -translate-x-1/2", i % 2 ? "bottom-[22px] z-[1] opacity-85" : "bottom-3.5 z-[2]")}
              style={{ left: `${v.x}%` }}
            >
              <Tooltip content={label ? `A visitor · ${label}` : "A visitor"} className="block">
                <Person look={lookOf(v.seed)} h={50} prop={v.prop} motion="idle" />
              </Tooltip>
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-text3">
        <span>Each stop counts what people did in the last {minutes} minutes.</span>
        <span>Hover anyone to see what they were doing.</span>
      </div>
    </>
  );
}
