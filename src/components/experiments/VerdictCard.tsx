import { CountUp } from "@/components/ui/CountUp";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import type { Experiment } from "@/types";

/** The answer in plain words, and the "chance treatment is better" gauge. */
export function VerdictCard({ e }: { e: Experiment }) {
  const chance = Number.isFinite(e.chance) ? Math.min(100, Math.max(0, e.chance)) : 0;
  return (
    <section
      className={cn(
        "fade grid min-w-0 grid-cols-[minmax(0,1fr)_260px] items-center gap-7 rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(16,24,40,.04)] max-[1080px]:grid-cols-1",
        e.lead ? "bg-[radial-gradient(600px_200px_at_0%_0%,var(--accent-soft),transparent_70%)] bg-card" : "bg-card",
      )}
    >
      <div>
        <h2 className="text-2xl leading-[1.25] font-semibold tracking-[-.02em]">{e.verdict[0]}</h2>
        <p className="mt-1.5 text-base text-text2">{e.verdict[1]}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text2">Chance treatment is better</span>
        <span className="text-[32px] font-semibold tracking-[-.02em] tabular-nums">
          <CountUp value={chance} />%
        </span>
        <div className="relative h-2 overflow-hidden rounded-[4px] border border-border bg-card2">
          <i className={cn("grow-x absolute inset-y-0 left-0 rounded-[4px]", e.lead ? "bg-accent" : "bg-text3")} style={{ width: `${chance}%`, animationDuration: "1.1s" }} />
        </div>
        <div className="mt-0.5 flex justify-between text-xs text-text3 tabular-nums">
          <span>
            {fmt(e.people)} of ~{fmt(e.needed)} people needed
          </span>
          <span>{e.progress}%</span>
        </div>
      </div>
    </section>
  );
}
