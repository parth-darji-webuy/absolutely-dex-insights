import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { safe } from "./chart-utils";

/** Horizontal bars with a label and a number. The biggest bar is highlighted. */
export function HBars({ rows, unit = "" }: { rows: readonly (readonly [string, number])[]; unit?: "%" | "" }) {
  const clean = rows.map(([l, v]) => [l, safe(v)] as const);
  const mx = Math.max(0, ...clean.map(([, v]) => v));
  if (!clean.length) return <p className="py-6 text-center text-[13px] text-text3">No data yet</p>;
  return (
    <div className="flex flex-col gap-[7px]">
      {clean.map(([l, v], i) => (
        <div key={l + i} className="grid grid-cols-[140px_minmax(0,1fr)_44px] items-center gap-2.5 text-[12.5px] max-sm:grid-cols-[96px_minmax(0,1fr)_44px]">
          <span className="truncate text-text3">{l}</span>
          <div className="h-3.5 overflow-hidden rounded bg-card2">
            <i
              className={cn("grow-x block h-full rounded", mx > 0 && v === mx ? "bg-c2" : "bg-text3")}
              style={{ width: `${mx > 0 ? (v / mx) * 100 : 0}%`, animationDelay: `${i * 60}ms` }}
            />
          </div>
          <b className="text-right font-semibold tabular-nums">{unit === "%" ? v.toFixed(1) + "%" : fmt(v)}</b>
        </div>
      ))}
    </div>
  );
}
