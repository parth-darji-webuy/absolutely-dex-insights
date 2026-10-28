"use client";

import { Icon } from "@/components/Icon";
import { useTipProps } from "@/components/ui/Tooltip";
import { fmt, pct } from "@/lib/format";

type Row = { label: string; visitors: number; addToCarts: number; color: string };

function Bar({ row, share, i }: { row: Row; share: number; i: number }) {
  const props = useTipProps(`${row.label}: ${pct(share)} of visitors`);
  return <i className="grow-x block h-full rounded-[5px]" style={{ width: `${share}%`, background: row.color, animationDelay: `${i * 90}ms` }} {...props} />;
}

const GRID = "grid grid-cols-[90px_minmax(0,1fr)_64px_76px] gap-3";

/** One line per device: share of visitors as a bar, visitor count, and how often they add to cart. */
export function DeviceRows({ rows, total, best, note }: { rows: Row[]; total: number; best: string | null; note: string | null }) {
  return (
    <div className="flex flex-col gap-4">
      <div className={`${GRID} text-[11.5px] text-text3 [&_span:nth-child(n+3)]:text-right`}>
        <span>Device</span>
        <span>Share of visitors</span>
        <span>Visitors</span>
        <span>Add rate</span>
      </div>
      {rows.map((d, i) => {
        const share = total > 0 ? (d.visitors / total) * 100 : 0;
        return (
          <div key={d.label} className={`${GRID} items-center text-[13px]`}>
            <span>{d.label}</span>
            <div className="h-2.5 overflow-hidden rounded-[5px] bg-card2">
              <Bar row={d} share={share} i={i} />
            </div>
            <b className="text-right font-semibold tabular-nums">{fmt(d.visitors)}</b>
            <em className="text-right text-text2 not-italic tabular-nums">
              {d.visitors > 0 ? pct((d.addToCarts / d.visitors) * 100) : "—"}
              {d.label === best && d.visitors > 0 ? " ▲" : ""}
            </em>
          </div>
        );
      })}
      {note && (
        <div className="mt-1 flex items-center gap-[9px] rounded-[9px] border border-border bg-card2 px-3 py-2.5 text-[12.5px] text-text2">
          <Icon name="info" /> {note}
        </div>
      )}
    </div>
  );
}
