import type { CSSProperties } from "react";
import { VariantPreview } from "@/components/site/VariantPreview";
import { CountUp } from "@/components/ui/CountUp";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { liftText } from "@/lib/experiment";
import { fmt } from "@/lib/format";
import type { Experiment } from "@/types";

/** Control or treatment: its name, conversion rate, how many people, and the storefront it shows. */
export function VariantCard({ e, side }: { e: Experiment; side: "c" | "t" }) {
  const v = e[side];
  const rate = side === "c" ? e.rc : e.rt;
  const isT = side === "t";
  const leading = isT && e.lead;
  const lift = liftText(e);
  return (
    <section
      className={cn(
        "fade flex min-w-0 flex-col gap-3.5 rounded-lg border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,.04)]",
        leading ? "border-[color-mix(in_srgb,var(--accent)_55%,var(--border))]" : "border-border",
      )}
      style={{ "--d": `${isT ? 60 : 0}ms` } as CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-text2">{isT ? "Treatment" : "Control"}</span>
        {leading && <Tag tone="lead">★ Leading</Tag>}
      </div>
      <div className="text-[15px] font-semibold">“{v.label}”</div>
      <div className="text-[32px] leading-[1.1] font-semibold tracking-[-.02em] tabular-nums">
        <CountUp value={rate} as="pct" />
        <small className="ml-2 text-[13px] font-medium tracking-normal text-text2">{e.verb}</small>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-text2">
        <span>
          <b className="text-text">{fmt(v.conv)}</b> of {fmt(v.people)} people who saw it
        </span>
        {isT ? (
          <span className={cn("text-xs font-semibold tabular-nums", lift === "—" ? "text-text2" : e.lift > 0 ? "text-green" : "text-red")}>
            {lift === "—" ? "— lift" : `${e.lift > 0 ? "▲" : "▼"} ${lift} lift`}
          </span>
        ) : (
          <span className="text-text3">baseline</span>
        )}
      </div>
      <VariantPreview e={e} side={side} />
    </section>
  );
}
