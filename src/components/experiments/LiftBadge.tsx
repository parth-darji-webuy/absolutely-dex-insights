import { Tag } from "@/components/ui/Tag";
import { pct } from "@/lib/format";
import type { Experiment } from "@/types";

/** "★ Treatment leading +20%" or "No clear leader · ▲ 1.2%". */
export function LiftBadge({ e }: { e: Pick<Experiment, "lead" | "lift"> }) {
  if (e.lead) return <Tag tone="lead">★ Treatment leading +{Number.isFinite(e.lift) ? e.lift.toFixed(0) : "0"}%</Tag>;
  if (!Number.isFinite(e.lift)) return <Tag>No clear leader · —</Tag>;
  return (
    <Tag>
      No clear leader · {e.lift > 0 ? "▲" : "▼"} {pct(Math.abs(e.lift))}
    </Tag>
  );
}
