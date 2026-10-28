"use client";

import { useId } from "react";
import { useTip } from "@/components/ui/Tooltip";
import type { LiftRange as Range } from "@/types";
import { safe } from "./chart-utils";

const W = 520;
const H = 134;
const PL = 20;
const PR = 20;
const Y = 52;

const signed = (n: number, digits = 0) => `${n > 0 ? "+" : ""}${n.toFixed(digits)}`;

type LiftRangeProps = {
  /** Best estimate of the lift, in %. */
  lift: number;
  /** Indicative range [low, high] in %, not GrowthBook's official interval. */
  range: Range;
  /** The treatment is leading: use the accent colour. */
  lead?: boolean;
};

export function LiftRange({ lift: rawLift, range, lead }: LiftRangeProps) {
  const tip = useTip();
  const gid = `lr${useId()}`;
  const lift = safe(rawLift);
  const a = safe(range[0]);
  const b = Math.max(safe(range[1]), a);
  const lo = Math.floor((Math.min(a, -10) - 5) / 10) * 10;
  const hi = Math.ceil((Math.max(b, 10) + 5) / 10) * 10;
  const X = (v: number) => PL + ((v - lo) / (hi - lo)) * (W - PL - PR);
  const colour = lead ? "var(--accent)" : "var(--c1)";
  const zeroAt = b > a ? Math.min(1, Math.max(0, (0 - a) / (b - a))) : 0;
  const above = b > a ? Math.round(Math.min(1, Math.max(0, b / (b - a))) * 100) : b > 0 ? 100 : 0;
  const ticks = Array.from({ length: (hi - lo) / 10 + 1 }, (_, k) => lo + k * 10);

  return (
    <>
      <div className="chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Lift range">
          {ticks.map((v) => (
            <g key={v}>
              <line className="gl" x1={X(v)} x2={X(v)} y1={20} y2={84} />
              <text x={X(v)} y={104} textAnchor="middle">
                {signed(v)}%
              </text>
            </g>
          ))}
          <defs>
            <linearGradient id={gid} x1="0" x2="1">
              <stop offset="0" stopColor="var(--text3)" stopOpacity=".35" />
              <stop offset={zeroAt.toFixed(3)} stopColor="var(--text3)" stopOpacity=".35" />
              <stop offset={zeroAt.toFixed(3)} stopColor={colour} stopOpacity=".35" />
              <stop offset="1" stopColor={colour} stopOpacity=".35" />
            </linearGradient>
          </defs>
          <rect className="growx" x={X(a)} y={Y - 12} width={Math.max(0, X(b) - X(a))} height={24} rx={12} fill={`url(#${gid})`} />
          <line x1={X(0)} x2={X(0)} y1={14} y2={90} stroke="var(--text2)" strokeWidth={1.5} />
          <text x={X(0)} y={100} textAnchor="middle" dy={16} style={{ fill: "var(--text2)" }}>
            No change
          </text>
          <circle
            className="popin"
            style={{ animationDelay: ".8s" }}
            cx={X(lift)}
            cy={Y}
            r={7}
            fill={colour}
            stroke="var(--card)"
            strokeWidth={2.5}
            onMouseMove={(e) => tip.show(`Best estimate: ${signed(lift, 1)}%`, e.clientX, e.clientY)}
            onMouseLeave={tip.hide}
          />
          <text className="lbl2" x={X(a)} y={Y - 18} textAnchor="middle">
            {a}%
          </text>
          <text className="lbl2" x={X(b)} y={Y - 18} textAnchor="middle">
            +{b}%
          </text>
        </svg>
      </div>
      <p className="mt-2 text-[13px] text-text2">
        The real lift is probably between <b>{a}%</b> and <b>+{b}%</b>, with a best guess of <b>{signed(lift, 1)}%</b>. About {above}% of that range is above zero. The range narrows as more people join.
      </p>
    </>
  );
}
