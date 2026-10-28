"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Tag } from "@/components/ui/Tag";
import { TipHead, TipRow, useTipProps } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { treatmentColour, trafficSplit } from "@/lib/experiment";
import { fmt, pct } from "@/lib/format";
import type { Experiment } from "@/types";

function Segment({ className, style, width, head, c, p }: { className: string; style?: React.CSSProperties; width: number; head: string; c: number; p: number }) {
  const props = useTipProps(
    <>
      <TipHead>{head}</TipHead>
      <TipRow label="People" value={fmt(c)} />
      <TipRow label="Share" value={pct(p)} />
    </>,
  );
  return <i className={cn("grow-x block h-full", className)} style={{ width: `${width}%`, ...style }} {...props} />;
}

/** People entering each variant in the last 24 hours, against the 50 / 50 the test expects. More than 5 points off is flagged. */
export function TrafficLine({ e }: { e: Experiment }) {
  const { c, t, pc, off } = trafficSplit(e);
  const mid = useTipProps("Expected 50 / 50");
  const known = pc !== null;
  const r = (v: number) => Math.round(v);
  return (
    <div
      className={cn(
        "fade flex items-center gap-3.5 rounded-[10px] border px-3.5 py-2.5 text-[13px] max-[820px]:flex-wrap max-[820px]:gap-y-3",
        off ? "border-amber-border bg-amber-soft" : "border-border bg-card",
      )}
    >
      <span className={cn("grid size-[26px] flex-none place-items-center rounded-full", off ? "bg-[color-mix(in_srgb,var(--amber)_16%,transparent)] text-amber" : "bg-green-soft text-green")}>
        <Icon name={off ? "warn" : "check"} size="sm" />
      </span>
      <div className="flex min-w-0 flex-col leading-[1.35] max-[820px]:flex-[1_1_200px]">
        <b className="font-semibold text-text">Traffic split {known ? `${r(pc)} / ${r(100 - pc)}` : "—"}</b>
        <span className="text-xs text-text3">
          {known ? `Last 24 hours · ${fmt(c)} vs ${fmt(t)} people · expected 50 / 50` : "Last 24 hours · nobody entered the test yet · expected 50 / 50"}
        </span>
      </div>
      {known && (
        <div className="relative h-2.5 min-w-[140px] flex-1 max-[820px]:order-3 max-[820px]:basis-full" role="img" aria-label={`Control ${r(pc)}%, treatment ${r(100 - pc)}%`}>
          <div className="flex h-full gap-0.5 overflow-hidden rounded-[5px]">
            <Segment className="bg-text3" width={pc} head={`Control · “${e.c.label}”`} c={c} p={pc} />
            <Segment className="[animation-delay:.15s]" style={{ background: treatmentColour(e) }} width={100 - pc} head={`Treatment · “${e.t.label}”`} c={t} p={100 - pc} />
          </div>
          <span className="absolute -top-[5px] -bottom-[5px] left-[calc(50%-1px)] w-0.5 rounded-[1px] bg-text" {...mid} />
        </div>
      )}
      {off ? (
        <>
          <span className="font-[550] whitespace-nowrap text-amber max-[820px]:order-4">Uneven, check tracking</span>
          <Link href="/events" className="inline-flex items-center gap-1 text-[13px] font-medium whitespace-nowrap text-amber hover:underline hover:underline-offset-[3px] max-[820px]:order-4">
            Check events <Icon name="chevR" size="sm" />
          </Link>
        </>
      ) : (
        known && (
          <Tag tone="ok" className="max-[820px]:order-4">
            <Icon name="check" size="sm" /> Normal
          </Tag>
        )
      )}
    </div>
  );
}
