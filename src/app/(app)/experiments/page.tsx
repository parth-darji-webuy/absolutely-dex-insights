import type { Metadata } from "next";
import { ExperimentList } from "@/components/experiments/ExperimentList";
import { PageHeading } from "@/components/shell/PageHeading";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { CardBoundary } from "@/components/ui/CardBoundary";
import { experiments } from "@/lib/queries";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Experiments" };

async function List() {
  return <ExperimentList experiments={await experiments()} />;
}

export default function Page() {
  return (
    <>
      <PageHeading page="experiments" />
      <CardBoundary>
        <Suspense fallback={<PageSkeleton variant="cards" noHeading />}>
          <List />
        </Suspense>
      </CardBoundary>
    </>
  );
}
