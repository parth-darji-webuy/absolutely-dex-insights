import { useId } from "react";
import { linePath, safe, scaleY, spreadX } from "./chart-utils";

const W = 96;
const H = 34;

/** A tiny line with a soft fill, for KPI cards. One value draws a flat line; none draws nothing. */
export function Sparkline({ values, id, className }: { values: number[]; id?: string; className?: string }) {
  const gid = `sp${id ?? ""}${useId()}`;
  if (!values.length) return null;
  const vals = (values.length === 1 ? [values[0], values[0]] : values).map(safe);
  const n = vals.length;
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const pts = vals.map((v, i): [number, number] => [spreadX(i, n, 0, W), scaleY(v, mn, mx, 3, H - 3)]);
  const line = linePath(pts);
  const [lx, ly] = pts[n - 1];
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="rise" d={`${line}L${W},${H}L0,${H}Z`} fill={`url(#${gid})`} />
      <path className="draw" pathLength={1} d={line} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <circle className="popin" style={{ animationDelay: "1s" }} cx={lx} cy={ly} r={2.2} fill="currentColor" />
    </svg>
  );
}
