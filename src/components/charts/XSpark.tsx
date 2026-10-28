import { linePath, safe } from "./chart-utils";

/** A two-line trend for experiment cards: control dashed grey, treatment solid. */
export function XSpark({ control, treatment, lead }: { control: number[]; treatment: number[]; lead?: boolean }) {
  const c = control.map(safe);
  const t = treatment.map(safe);
  const n = Math.max(c.length, t.length);
  if (n < 1) return null;
  const all = [...c, ...t];
  const mn = Math.min(...all) - 0.5;
  const mx = Math.max(...all) + 0.5;
  const P = (a: number[]) => linePath(a.map((v, i): [number, number] => [n > 1 ? (i * 200) / (n - 1) : 0, 36 - ((v - mn) / (mx - mn)) * 32]));
  return (
    <svg className="block h-10 w-full" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
      <path d={P(c)} fill="none" stroke="var(--text3)" strokeWidth={1.5} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      <path d={P(t)} fill="none" stroke={lead ? "var(--accent)" : "var(--c1)"} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
