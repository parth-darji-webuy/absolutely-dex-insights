"use client";

import Link from "next/link";
import { Flag } from "@/components/ui/Flag";
import { MiniBars } from "@/components/charts/MiniBars";
import { cn } from "@/lib/cn";
import { fmt, pct } from "@/lib/format";
import { treatmentColour } from "@/lib/experiment";
import type { Experiment, RecentWindow } from "@/types";

const rate = (v: [number, number]) => (v[0] > 0 ? (v[1] / v[0]) * 100 : NaN);

function Row({ e, w, side }: { e: Experiment; w: RecentWindow; side: "c" | "t" }) {
  const v = w[side];
  const label = e[side].label;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_34px_34px_44px] items-center gap-1.5 text-xs [&_b]:text-right [&_em]:text-right">
      <span className="flex min-w-0 items-center gap-1.5 text-text2" title={`${side === "t" ? "Treatment" : "Control"}: ${label}`}>
        <i className="size-2 flex-none rounded-[2px]" style={{ background: side === "t" ? treatmentColour(e) : "var(--text3)" }} />
        <span className="truncate">{label}</span>
      </span>
      <b className="font-semibold tabular-nums">{fmt(v[0])}</b>
      <b className="font-semibold tabular-nums">{fmt(v[1])}</b>
      <em className="text-text2 not-italic tabular-nums">{pct(rate(v))}</em>
    </div>
  );
}

/** One test's last 30 minutes: people who saw it, conversions, bars per minute, and both variants. */
export function RunCard({ e, w, minutes, delay }: { e: Experiment; w: RecentWindow; minutes: number; delay: number }) {
  const people = w.c[0] + w.t[0];
  const tips = w.mins.map((v, i) => `${minutes - i} min ago: ${fmt(v)} ${v === 1 ? "person" : "people"}`);
  return (
    <Link
      href={`/experiments/${e.key}`}
      className={cn(
        "fade flex flex-col gap-2.5 rounded-[10px] border border-border bg-card p-3.5 transition-[border-color,box-shadow,transform] duration-150",
        "hover:-translate-y-px hover:border-border2 hover:shadow-[0_8px_20px_rgba(16,24,40,.07)]",
      )}
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-2">
        <b className="text-[13.5px] leading-[1.3] font-semibold">{e.name}</b>
        <Flag className="text-[10.5px] whitespace-nowrap">{e.flag}</Flag>
      </div>
      <div className="flex items-baseline gap-2 text-[12.5px] text-text2">
        <b className="text-[22px] font-semibold tracking-[-.02em] text-text tabular-nums">{fmt(people)}</b>
        <span>people saw this test</span>
      </div>
      <div className="flex flex-wrap gap-3.5 text-xs text-text3">
        <span>
          <b className="font-semibold text-text tabular-nums">{fmt(w.c[1] + w.t[1])}</b> {e.verb}
        </span>
      </div>
      <MiniBars values={w.mins} tips={tips} dense />
      <div className="grid grid-cols-[minmax(0,1fr)_34px_34px_44px] gap-1.5 border-t border-border pt-2 text-[11px] text-text3 [&_span:nth-child(n+2)]:text-right">
        <span>Control vs treatment</span>
        <span>Saw it</span>
        <span>Conv.</span>
        <span>Rate</span>
      </div>
      <Row e={e} w={w} side="c" />
      <Row e={e} w={w} side="t" />
    </Link>
  );
}
