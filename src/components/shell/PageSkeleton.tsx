import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { SkeletonStack } from "@/components/ui/Skeleton";

type Variant = "overview" | "cards" | "table";

function Heading() {
  return (
    <div className="flex flex-col gap-2.5" aria-hidden="true">
      <Skeleton w="220px" h={34} />
      <Skeleton w="340px" h={14} />
    </div>
  );
}

/** What a page looks like while its data loads: the heading, then grey cards shaped like the real ones. */
export function PageSkeleton({ variant }: { variant: Variant }) {
  return (
    <>
      <Heading />
      {variant === "overview" && (
        <>
          <Card loading skeleton="text" />
          <div className="grid grid-cols-3 gap-4 max-[560px]:grid-cols-1">
            {[0, 1, 2].map((i) => (
              <Card key={i} loading skeleton="kpi" delay={i * 50} />
            ))}
          </div>
          <Card title="" loading skeleton="chart" delay={100} />
        </>
      )}
      {variant === "cards" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4 max-[560px]:grid-cols-1">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} delay={i * 50}>
              <SkeletonStack kind="text" />
              <div className="mt-4">
                <SkeletonStack kind="kpi" />
              </div>
            </Card>
          ))}
        </div>
      )}
      {variant === "table" && <Card loading skeleton="table" />}
    </>
  );
}
