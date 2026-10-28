import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

export type SkeletonKind = "kpi" | "chart" | "table" | "text" | "list";

export function Skeleton({ w = "100%", h = 12, className, style }: { w?: string; h?: number; className?: string; style?: CSSProperties }) {
  return <span className={cn("sk", className)} style={{ width: w, height: h, ...style }} aria-hidden="true" />;
}

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-3" role="status" aria-label="Loading">
    {children}
  </div>
);

/** Grey placeholders shaped like what is about to load. */
export function SkeletonStack({ kind = "list" }: { kind?: SkeletonKind }) {
  if (kind === "kpi")
    return (
      <Stack>
        <Skeleton w="40%" h={11} />
        <Skeleton w="55%" h={28} />
        <Skeleton w="35%" h={11} />
      </Stack>
    );
  if (kind === "chart")
    return (
      <Stack>
        <Skeleton h={220} className="rounded-[10px]" />
        <Skeleton w="60%" h={11} />
      </Stack>
    );
  if (kind === "table")
    return (
      <Stack>
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} h={18} />
        ))}
      </Stack>
    );
  if (kind === "text")
    return (
      <Stack>
        <Skeleton w="70%" h={16} />
        <Skeleton w="45%" h={11} />
      </Stack>
    );
  return (
    <Stack>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton w="34px" h={34} className="flex-none rounded-[9px]" />
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton w={`${80 - i * 8}%`} h={11} />
            <Skeleton w="40%" h={8} />
          </div>
        </div>
      ))}
    </Stack>
  );
}
