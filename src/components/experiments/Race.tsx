"use client";

import { useEffect, useRef, useState } from "react";
import { Person } from "@/components/people/Person";
import type { Look } from "@/components/people/look";
import { cn } from "@/lib/cn";
import { racePositions } from "@/lib/experiment";
import { pct } from "@/lib/format";
import type { Experiment } from "@/types";

const CONTROL: Look = { skin: "#E0AC83", shirt: "#8A90A0", pants: "#3E4C6E", hair: "#5A3A22", style: "short" };
const treatment = (lead: boolean): Look => ({ skin: "#9A6644", shirt: lead ? "#6E56CF" : "#4F72D0", pants: "#2D3142", hair: "#1C1C1C", style: "cap" });

function Lane({ side, label, rate, to, lead, index, look }: { side: "c" | "t"; label: string; rate: number; to: number; lead: boolean; index: number; look: Look }) {
  const runner = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  // The runner sprints to its spot and stops; the leader gets a star.
  useEffect(() => {
    const el = runner.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof el.animate !== "function") {
      el.style.left = `${to}%`;
      setDone(true);
      return;
    }
    el.style.left = "3%";
    setDone(false);
    const run = el.animate([{ left: "3%" }, { left: `${to}%` }], {
      duration: 1600 + index * 250,
      easing: "cubic-bezier(.3,.6,.4,1)",
      fill: "forwards",
      delay: 250,
    });
    run.onfinish = () => {
      el.style.left = `${to}%`;
      run.cancel();
      setDone(true);
    };
    return () => run.cancel();
  }, [to, index]);

  return (
    <div
      className={cn("relative h-[74px] overflow-hidden rounded-[10px] border", lead ? "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))]" : "border-border")}
      style={{ background: "repeating-linear-gradient(90deg,var(--card2) 0 40px,#fff 40px 41px)" }}
    >
      <span className="absolute top-2 left-3 z-[1] text-xs font-[550] text-text2">
        {side === "t" ? "Treatment" : "Control"} · “{label}” <b className="text-text tabular-nums">{pct(rate)}</b>
      </span>
      <span className="absolute inset-x-0 bottom-3.5 border-t-2 border-dashed border-border2" />
      <span className="absolute inset-y-0 right-0 w-3 opacity-75" style={{ background: "repeating-conic-gradient(#262833 0 25%,#fff 0 50%) 0 0/6px 6px" }} />
      <div ref={runner} className="absolute bottom-1.5 -translate-x-1/2" style={{ left: "3%" }}>
        {lead && <span className={cn("absolute -top-4 left-1/2 -translate-x-1/2 text-[15px] text-[#F5B400] opacity-0 transition-opacity duration-[400ms]", done && "animate-[float_1.8s_ease-in-out_infinite] opacity-100")}>★</span>}
        <Person look={look} h={54} motion={done ? "idle" : "walking"} className={done ? undefined : "run"} />
      </div>
    </div>
  );
}

/** Each runner goes as far as their conversion rate. */
export function Race({ e }: { e: Experiment }) {
  const pos = racePositions(e);
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Lane side="c" label={e.c.label} rate={e.rc} to={pos.c} lead={false} index={0} look={CONTROL} />
        <Lane side="t" label={e.t.label} rate={e.rt} to={pos.t} lead={e.lead} index={1} look={treatment(e.lead)} />
      </div>
      <div className="flex justify-between px-3 pt-0.5 text-[11px] text-text3 tabular-nums">
        <span>0%</span>
        <span>{(pos.max / 2).toFixed(0)}%</span>
        <span>
          {pos.max}% {e.metricShort}
        </span>
      </div>
    </>
  );
}
