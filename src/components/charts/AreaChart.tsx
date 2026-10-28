"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { TipHead, TipRow } from "@/components/ui/Tooltip";
import { useChartHover } from "@/hooks/useChartHover";
import { fmt as fmtInt } from "@/lib/format";
import { linePath, niceMax, safe, spreadX } from "./chart-utils";

export type AreaSeries = {
  key: string;
  name: string;
  color: string;
  values: number[];
  /** Soft fill under a single (non-stacked) line. */
  fill?: boolean;
  dash?: boolean;
  /** Line width. */
  w?: number;
};

type AreaChartProps = {
  labels: string[];
  series: AreaSeries[];
  stacked?: boolean;
  /** Keys of series the visitor switched off in the legend. */
  hidden?: string[];
  w?: number;
  h?: number;
  min?: number;
  max?: number;
  unit?: "%" | "";
  /** Screen-reader description. */
  label?: string;
};

const PL = 46;
const PR = 14;
const PT = 12;
const PB = 30;

export function AreaChart({ labels, series, stacked, hidden = [], w: W = 760, h: H = 260, min = 0, max, unit = "", label = "chart" }: AreaChartProps) {
  const n = labels.length;
  const vis = series.filter((s) => !hidden.includes(s.key));
  const clean = vis.map((s) => ({ ...s, values: labels.map((_, i) => safe(s.values[i])) }));

  const zeros: number[] = new Array(n).fill(0);
  const layers = clean.reduce<{ s: (typeof clean)[number]; base: number[]; top: number[] }[]>((acc, s) => {
    const below = stacked && acc.length ? acc[acc.length - 1].top : zeros;
    const top = stacked ? below.map((c, i) => c + s.values[i]) : [...s.values];
    return [...acc, { s, base: [...below], top }];
  }, []);
  const stackTop = layers.length ? layers[layers.length - 1].top : zeros;
  const peak = stacked ? Math.max(0, ...stackTop) : Math.max(0, ...clean.flatMap((s) => s.values));
  // Tiny or all-zero data gets a 0 to 4 axis, so the ticks stay whole numbers.
  const hi = max ?? (peak * 1.06 <= 4 ? 4 : niceMax(peak * 1.06));
  const X = (i: number) => spreadX(i, n, PL, W - PR);
  const Y = (v: number) => PT + (H - PT - PB) * (1 - (v - min) / (hi - min || 1));
  const axis = (v: number) => (unit === "%" ? `${Math.round(v)}%` : fmtInt(v));
  const showValue = (v: number) => (unit === "%" ? v.toFixed(1) + "%" : fmtInt(v));

  const { index, handlers } = useChartHover({ W, n, pl: PL, pr: PR }, (i) => (
    <>
      <TipHead>{labels[i]}</TipHead>
      {[...layers].reverse().map((l) => (
        <TipRow key={l.s.key} color={l.s.color} label={l.s.name} value={showValue(l.s.values[i])} />
      ))}
      {stacked && layers.length > 1 && <TipRow total label="Total" value={fmtInt(layers.reduce((a, l) => a + l.s.values[i], 0))} />}
    </>
  ));

  if (n < 1) return <EmptyState title="No data yet" text="Numbers show up here once there is something to count." />;
  if (!vis.length) return <EmptyState title="All series hidden" text="Turn a series back on from the legend." />;

  const step = Math.ceil(n / 8);
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {[0, 1, 2, 3, 4].map((k) => {
          const v = min + ((hi - min) * k) / 4;
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
          i % step === 0 || i === n - 1 ? (
            <text key={i} x={X(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>
              {l}
            </text>
          ) : null,
        )}
        {layers.map(({ s, base, top }, li) => {
          const line = linePath(top.map((v, i): [number, number] => [X(i), Y(v)]));
          const back = stacked
            ? base
                .map((v, i): [number, number] => [X(i), Y(v)])
                .reverse()
                .map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`)
                .join("")
            : `L${X(n - 1)},${Y(min)}L${X(0)},${Y(min)}`;
          return (
            <g key={s.key}>
              {(stacked || s.fill) && (
                <path d={`${line}${back}Z`} fill={s.color} fillOpacity={stacked ? 0.2 : 0.1} className="rise" style={{ animationDelay: `${li * 90}ms` }} />
              )}
              {s.dash ? (
                <path d={line} fill="none" stroke={s.color} strokeWidth={s.w || 1.6} strokeLinejoin="round" strokeDasharray="4 4" style={{ animation: "fade .8s var(--ease) both .3s" }} />
              ) : (
                <path className="draw" pathLength={1} d={line} fill="none" stroke={s.color} strokeWidth={s.w || 1.6} strokeLinejoin="round" style={{ animationDelay: `${li * 90}ms` }} />
              )}
            </g>
          );
        })}
        {index !== null && (
          <>
            <line className="guide" x1={X(index)} x2={X(index)} y1={PT} y2={H - PB} />
            {layers.map((l) => (
              <circle key={l.s.key} cx={X(index)} cy={Y(l.top[index])} r={3.5} fill="var(--card)" stroke={l.s.color} strokeWidth={2} />
            ))}
          </>
        )}
        <rect className="hit" x={PL} y={PT} width={W - PL - PR} height={H - PT - PB} fill="transparent" {...handlers} />
      </svg>
    </div>
  );
}
