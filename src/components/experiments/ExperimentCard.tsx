import Link from "next/link";
import type { CSSProperties } from "react";
import { XSpark } from "@/components/charts";
import { Flag } from "@/components/ui/Flag";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { treatmentColour } from "@/lib/experiment";
import { fmt } from "@/lib/format";
import type { Experiment } from "@/types";
import { LiftBadge } from "./LiftBadge";

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <b className="block text-base font-semibold tabular-nums">{value}</b>
    <span className="text-xs text-text3">{label}</span>
  </div>
);

/** One test on the Experiments page. The whole card opens the test. */
export function ExperimentCard({ e, delay = 0 }: { e: Experiment; delay?: number }) {
  return (
    <Link
      href={`/experiments/${e.key}`}
      className="fade flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-border2"
      style={{ "--d": `${delay}ms` } as CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={e.status} />
        <Flag>{e.flag}</Flag>
      </div>
      <div>
        <h3 className="text-[15px] font-semibold tracking-[-.01em]">{e.name}</h3>
        <p className="mt-0.5 text-[13px] text-text2">{e.desc}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <LiftBadge e={e} />
        <span className="flex gap-3.5 text-[11px] text-text2">
          <span className="inline-flex items-center gap-1.5">
            <i className="h-0.5 w-2.5 rounded-[1px] bg-text3" />
            Control
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="h-0.5 w-2.5 rounded-[1px]" style={{ background: treatmentColour(e) }} />
            Treatment
          </span>
        </span>
      </div>
      <XSpark control={e.series.c} treatment={e.series.t} lead={e.lead} />
      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
        <Stat value={fmt(e.people)} label="people in test" />
        <Stat value={fmt(e.days)} label="days running" />
        <Stat value={e.chance == null ? "—" : `${e.chance}%`} label="sure of leader" />
      </div>
    </Link>
  );
}
