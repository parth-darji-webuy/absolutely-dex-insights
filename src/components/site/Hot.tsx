import type { ReactNode } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";

/** The number pill laid over the part of the store that was tested. `lo` is the greyed version. */
export function Hot({ children, tip, lo }: { children: ReactNode; tip: string; lo?: boolean }) {
  return (
    <Tooltip content={tip} className={cn("hot", lo && "lo")}>
      {children}
    </Tooltip>
  );
}
