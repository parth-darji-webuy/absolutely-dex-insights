"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { useTip } from "@/components/ui/Tooltip";
import { fmt, pct } from "@/lib/format";
import type { Product } from "@/types";
import { safe, sumOf } from "./chart-utils";

const W = 620;
const H = 300;
const PL = 50;
const PR = 24;
const PT = 18;
const PB = 40;
/** The "viewed a lot, rarely added" zone starts here. */
const BUSY_VIEWS = 2700;

// Where a label sits next to its bubble. Products not listed go to the right.
const LABEL_SIDE: Record<string, "start" | "end" | "middle"> = {
  "Atlas Leather Weekender": "end",
  "Aperture R4 Mirrorless 8K Camera": "middle",
  "Chronos Obsidian Sapphire Watch": "end",
};

/** Bubble chart: x = product views, y = add-to-cart rate, size = add-to-carts. */
export function ProductScatter({ products }: { products: Product[] }) {
  const tip = useTip();
  if (!products.length) return <EmptyState title="No products yet" text="Products appear here once people start viewing them." />;

  const views = products.map((p) => safe(p.views));
  const rate = (p: Product) => (p.views > 0 ? (safe(p.atc) / p.views) * 100 : 0);
  const rates = products.map(rate);

  // The prototype's fixed ranges, widened only if a product falls outside them.
  const x0 = Math.min(1500, Math.floor(Math.min(...views) / 500) * 500);
  const x1 = Math.max(4500, Math.ceil(Math.max(...views) / 500) * 500);
  const y0 = Math.min(4, Math.floor(Math.min(...rates) / 4) * 4);
  const y1 = Math.max(16, Math.ceil(Math.max(...rates) / 4) * 4);
  const X = (v: number) => PL + ((v - x0) / (x1 - x0)) * (W - PL - PR);
  const Y = (v: number) => PT + (1 - (v - y0) / (y1 - y0)) * (H - PT - PB);

  const totalViews = sumOf(views);
  const avg = totalViews > 0 ? (sumOf(products.map((p) => p.atc)) / totalViews) * 100 : 0;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Interest vs conversion">
        {Array.from({ length: Math.floor((y1 - y0) / 4) + 1 }, (_, k) => y0 + k * 4).map((v) => (
          <g key={v}>
            <line className="gl" x1={PL} x2={W - PR} y1={Y(v)} y2={Y(v)} />
            <text x={PL - 10} y={Y(v) + 4} textAnchor="end">
              {v}%
            </text>
          </g>
        ))}
        {Array.from({ length: Math.floor((x1 - x0) / 1000) + 1 }, (_, k) => x0 + k * 1000).map((v) => (
          <text key={v} x={X(v)} y={H - 18} textAnchor="middle">
            {fmt(v)}
          </text>
        ))}
        <text x={(PL + W - PR) / 2} y={H - 2} textAnchor="middle">
          Product views this week →
        </text>
        <rect x={X(BUSY_VIEWS)} y={Y(avg)} width={Math.max(0, W - PR - X(BUSY_VIEWS))} height={Math.max(0, Y(y0) - Y(avg))} fill="var(--text3)" fillOpacity={0.08} />
        <text x={W - PR - 8} y={Y(y0) - 8} textAnchor="end" style={{ fill: "var(--text2)", fontWeight: 550 }}>
          Viewed a lot, rarely added
        </text>
        <line x1={PL} x2={W - PR} y1={Y(avg)} y2={Y(avg)} stroke="var(--text3)" strokeDasharray="4 4" />
        <text x={PL + 6} y={Y(avg) - 6}>
          Average {pct(avg)}
        </text>
        {products.map((p, i) => {
          const r = 8 + Math.sqrt(Math.max(0, safe(p.atc))) * 0.9;
          const cold = rates[i] < avg && p.views > BUSY_VIEWS;
          const colour = cold ? "var(--c5)" : "var(--accent)";
          const anchor = LABEL_SIDE[p.name] ?? "start";
          const lx = anchor === "middle" ? 0 : anchor === "end" ? -r - 6 : r + 6;
          const ly = anchor === "middle" ? r + 16 : 4;
          return (
            <g key={p.id}>
              <circle
                className="popin"
                cx={X(p.views)}
                cy={Y(rates[i])}
                r={+r.toFixed(1)}
                fill={colour}
                fillOpacity={0.22}
                stroke={colour}
                strokeWidth={1.5}
                style={{ cursor: "pointer", animationDelay: `${i * 120}ms` }}
                onMouseMove={(e) =>
                  tip.show(
                    <>
                      <b className="text-text">{p.name}</b>
                      <br />
                      {fmt(p.views)} views · {fmt(p.atc)} added · {pct(rates[i])}
                    </>,
                    e.clientX,
                    e.clientY,
                  )
                }
                onMouseLeave={tip.hide}
              />
              <text className="lbl2" x={X(p.views) + lx} y={Y(rates[i]) + ly} textAnchor={anchor}>
                {p.name.split(" ").slice(0, 2).join(" ")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
