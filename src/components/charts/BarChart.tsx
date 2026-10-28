"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { TipHead, TipRow } from "@/components/ui/Tooltip";
import { useChartHover } from "@/hooks/useChartHover";
import { fmt as fmtInt } from "@/lib/format";
import { niceMax, safe, sumOf } from "./chart-utils";

export type BarSeries = { name: string; color: string; values: number[]; alpha?: number };

type BarChartProps = {
  labels: string[];
  /** One series gives plain bars; several stack. */
  series: BarSeries[];
  w?: number;
  h?: number;
  max?: number;
  /** Bar width as a share of its slot. */
  fill?: number;
  /** Show every n-th label. */
  every?: number;
  unit?: "%" | "";
  label?: string;
};

const PL = 44;
const PR = 10;
const PT = 12;
const PB = 28;

export function BarChart({ labels, series, w: W = 760, h: H = 220, max, fill = 0.62, every, unit = "", label = "bar chart" }: BarChartProps) {
  const n = labels.length;
  const clean = series.map((s) => ({ ...s, values: labels.map((_, i) => safe(s.values[i])) }));
  const band = (W - PL - PR) / Math.max(n, 1);
  const bw = Math.max(2, band * fill);
  const totals = labels.map((_, i) => sumOf(clean.map((s) => s.values[i])));
  const top = Math.max(0, ...totals) * 1.06;
  // Tiny or all-zero data gets a 0 to 4 axis, so the ticks stay whole numbers.
  const hi = max ?? (top <= 4 ? 4 : niceMax(top));
  const X = (i: number) => PL + band * i + band / 2;
  const Y = (v: number) => PT + (H - PT - PB) * (1 - v / hi);
  const axis = (v: number) => (unit === "%" ? `${Math.round(v)}%` : fmtInt(v));
  const showValue = (v: number) => (unit === "%" ? v.toFixed(1) + "%" : fmtInt(v));

  const { index, handlers } = useChartHover({ W, n, pl: PL, pr: PR, band }, (i) => (
    <>
      <TipHead>{labels[i]}</TipHead>
      {[...clean].reverse().map((s) => (
        <TipRow key={s.name} color={s.color} label={s.name} value={showValue(s.values[i])} />
      ))}
      {clean.length > 1 && <TipRow total label="Total" value={fmtInt(totals[i])} />}
    </>
  ));

  if (n < 1 || !clean.length) return <EmptyState title="No data yet" text="Numbers show up here once there is something to count." />;

  const steps = Number.isInteger(hi / 4) ? 4 : 5;
  const stride = every || Math.ceil(n / 8);
  const cum = new Array(n).fill(0);
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {Array.from({ length: steps + 1 }, (_, k) => {
          const v = (hi * k) / steps;
          const y = Y(v);
          return (
            <g key={k}>
              <line className="gl" x1={PL} x2={W - PR} y1={y} y2={y} />
              <text x={PL - 10} y={y + 4} textAnchor="end">
                {axis(v)}
              </text>
            </g>
          );
        })}
        {labels.map((l, i) =>
          i % stride === 0 || i === n - 1 ? (
            <text key={i} x={X(i)} y={H - 8} textAnchor="middle">
              {l}
            </text>
          ) : null,
        )}
        {index !== null && <rect x={X(index) - band / 2} y={PT} width={band} height={H - PB - PT} fill="var(--text)" opacity={0.05} rx={3} />}
        {clean.map((s, si) =>
          s.values.map((v, i) => {
            const y0 = Y(cum[i]);
            cum[i] += v;
            const y1 = Y(cum[i]);
            if (v <= 0) return null;
            return (
              <rect
                key={`${si}-${i}`}
                className="bar-up"
                x={+(X(i) - bw / 2).toFixed(1)}
                y={+y1.toFixed(1)}
                width={+bw.toFixed(1)}
                height={Math.max(0, +(y0 - y1).toFixed(1))}
                rx={si === clean.length - 1 ? 2 : 0}
                fill={s.color}
                fillOpacity={s.alpha}
                style={{ animationDelay: `${Math.min(i * 12, 300)}ms` }}
              />
            );
          }),
        )}
        <rect className="hit" x={PL} y={PT} width={W - PL - PR} height={H - PT - PB} fill="transparent" {...handlers} />
      </svg>
    </div>
  );
}
