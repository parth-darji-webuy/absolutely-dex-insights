"use client";

import type { ReactNode } from "react";
import { TipRow, useTip } from "@/components/ui/Tooltip";
import { fmt, pct } from "@/lib/format";
import { safe, sumOf } from "./chart-utils";

export type DonutSegment = { label: string; value: number; color: string };

type DonutProps = {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  /** Big text in the middle. */
  center?: ReactNode;
  /** Small text under it. */
  sub?: ReactNode;
  /** Show the list of segments beside the ring. */
  list?: boolean;
};

export function Donut({ segments, size = 150, stroke = 22, center, sub, list = true }: DonutProps) {
  const tip = useTip();
  const segs = segments.map((s) => ({ ...s, value: Math.max(0, safe(s.value)) }));
  const tot = sumOf(segs.map((s) => s.value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const lens = segs.map((s) => (tot > 0 ? (s.value / tot) * c : 0));
  const gap = segs.length > 1 ? 2 : 0;
  const arcs = segs.map((s, i) => ({
    s,
    i,
    len: lens[i],
    off: lens.slice(0, i).reduce((a, b) => a + b, 0),
    dash: Math.max(0, lens[i] - gap),
  }));

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="donut relative flex-none" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="block size-full" role="img" aria-label={segs.map((s) => `${s.label} ${fmt(s.value)}`).join(", ") || "No data"}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card2)" strokeWidth={stroke} />
          {arcs.map(({ s, i, len, off: o, dash }) =>
            len > 0 ? (
              <circle
                key={s.label + i}
                className="seg"
                style={{ animationDelay: `${i * 120}ms` }}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash.toFixed(2)} ${c.toFixed(2)}`}
                strokeDashoffset={(-o).toFixed(2)}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                onMouseMove={(e) =>
                  tip.show(
                    <>
                      <b className="text-text">{s.label}</b>
                      <TipRow label={fmt(s.value)} value={pct((s.value / tot) * 100)} />
                    </>,
                    e.clientX,
                    e.clientY,
                  )
                }
                onMouseLeave={tip.hide}
              />
            ) : null,
          )}
        </svg>
        {(center !== undefined || sub !== undefined) && (
          <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            <b className="text-xl font-semibold tracking-[-.02em] tabular-nums">{center}</b>
            <span className="text-[11px] text-text3">{sub}</span>
          </div>
        )}
      </div>
      {list && <DonutList segments={segs} />}
    </div>
  );
}

export function DonutList({ segments }: { segments: DonutSegment[] }) {
  const tot = sumOf(segments.map((s) => s.value));
  return (
    <div className="flex min-w-[180px] flex-1 flex-col gap-[9px]">
      {segments.map((s, i) => (
        <div key={s.label + i} className="grid grid-cols-[10px_minmax(0,1fr)_auto_48px] items-center gap-2.5 text-[13px]">
          <i className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
          <span>{s.label}</span>
          <b className="text-right font-semibold tabular-nums">{fmt(s.value)}</b>
          <em className="text-right text-xs text-text3 not-italic tabular-nums">{tot > 0 ? pct((safe(s.value) / tot) * 100) : "—"}</em>
        </div>
      ))}
    </div>
  );
}
