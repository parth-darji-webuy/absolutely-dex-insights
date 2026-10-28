import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsLoader } from "@/components/reports/ReportsLoader";
import { PageHeading } from "@/components/shell/PageHeading";
import { Card } from "@/components/ui/Card";
import { CardBoundary } from "@/components/ui/CardBoundary";

export const metadata: Metadata = { title: "Reports" };

export default function Page() {
  return (
    <>
      <PageHeading page="reports" />
      <CardBoundary title="Experiment reports">
        <Suspense
          fallback={
            <>
              <Card loading skeleton="text" />
              <Card title="Experiment reports" subtitle="One row per day, per variant" loading skeleton="table" delay={60} />
            </>
          }
        >
          <ReportsLoader />
        </Suspense>
      </CardBoundary>
    </>
  );
}
