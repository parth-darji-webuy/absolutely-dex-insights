import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Sparkline } from "@/components/charts/Sparkline";
import { cn } from "@/lib/cn";
import { CountUp } from "./CountUp";
import { SkeletonStack } from "./Skeleton";
import { Tooltip } from "./Tooltip";

type KpiProps = {
  label: string;
  /** Explains where the number comes from, on hover. */
  tip?: string;
  value: number;
  format?: "int" | "pct";
  /** Small grey word after the number, e.g. "running". */
  unit?: string;
  /** Anything shown under the number, e.g. a <Delta/> or a <Tag/>. */
  foot?: ReactNode;
  spark?: number[];
  loading?: boolean;
  /** Makes the whole card a link. */
  href?: string;
  delay?: number;
  id: string;
};

const BASE =
  "fade relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-lg border border-border bg-card px-5 pt-[18px] pb-4 text-left shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-[transform,box-shadow,border-color] duration-200";
const HOVER = "hover:-translate-y-0.5 hover:border-border2 hover:shadow-[0_10px_24px_rgba(16,24,40,.08)]";

export function Kpi({ label, tip, value, format = "int", unit, foot, spark, loading, href, delay = 0, id }: KpiProps) {
  const style = { "--d": `${delay}ms` } as CSSProperties;
  if (loading)
    return (
      <div className={BASE} style={style}>
        <span className="text-xs font-medium text-text2">{label}</span>
        <SkeletonStack kind="kpi" />
      </div>
    );
  const body = (
    <>
      <span className="text-xs font-medium text-text2">{tip ? <Tooltip content={tip}>{label}</Tooltip> : label}</span>
      <div className="text-[30px] leading-[1.15] font-semibold tracking-[-.025em]">
        <CountUp value={value} as={format} />
        {unit && <small className="ml-1.5 text-sm font-medium tracking-normal text-text2">{unit}</small>}
      </div>
      <div className="flex items-center gap-2 text-xs text-text3">{foot}</div>
      {spark && spark.length > 0 && <Sparkline values={spark} id={id} className="absolute top-[18px] right-4 h-[34px] w-24 text-text3" />}
    </>
  );
  if (href)
    return (
      <Link href={href} className={cn(BASE, HOVER)} style={style}>
        {body}
      </Link>
    );
  return (
    <div className={cn(BASE, HOVER)} style={style}>
      {body}
    </div>
  );
}
