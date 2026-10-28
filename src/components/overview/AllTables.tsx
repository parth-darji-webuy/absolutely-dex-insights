import { Tooltip } from "@/components/ui/Tooltip";
import { TRACKING_TABLES } from "@/lib/tables";

/** "all 6 tracking tables" for a Source line; hover lists them. */
export function AllTables() {
  return (
    <Tooltip content={TRACKING_TABLES.join(", ")}>
      <code className="rounded-[5px] border border-border bg-card2 px-1.5 py-px text-[11px] text-text2">all {TRACKING_TABLES.length} tracking tables</code>
    </Tooltip>
  );
}
