"use client";

import Link from "next/link";
import { Flag } from "@/components/ui/Flag";
import { Kpi } from "@/components/ui/Kpi";
import { Popover } from "@/components/ui/Popover";
import { Tag } from "@/components/ui/Tag";

type FlagItem = { key: string; flag: string; name: string };

/** The Features card. Clicking it lists the flags; each one opens its experiment. */
export function FlagsKpi({ flags, spark, delay }: { flags: FlagItem[]; spark: number[]; delay?: number }) {
  return (
    <Popover
      width={400}
      label="Feature flags"
      trigger={(props) => (
        <Kpi
          id="k1"
          label="Features"
          tip="Feature flags in GrowthBook · Production"
          value={flags.length}
          unit="flags on"
          spark={spark}
          delay={delay}
          button={props}
          foot={
            <>
              <Tag>All {flags.length} in experiments</Tag>
              <span>Click to see them</span>
            </>
          }
        />
      )}
    >
      {(close) => (
        <div className="flex flex-col p-1.5">
          <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-[.06em] text-text3 uppercase">Feature flags · Production</div>
          {flags.length === 0 && <p className="px-2.5 py-2 text-[13px] text-text2">No feature flags yet.</p>}
          {flags.map((f) => (
            <Link
              key={f.key}
              href={`/experiments/${f.key}`}
              onClick={close}
              className="flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13px] text-text hover:bg-hover"
            >
              <Flag className="flex-none whitespace-nowrap">{f.flag}</Flag>
              <span className="min-w-0 truncate">{f.name}</span>
            </Link>
          ))}
        </div>
      )}
    </Popover>
  );
}
