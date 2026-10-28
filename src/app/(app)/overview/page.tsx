import type { Metadata } from "next";
import { ActivityCard, DevicesCard, SourcesCard, StoreCard, TopProductsCard } from "@/components/overview/OverviewCards";
import { ExperimentsKpi, FeaturesKpi, VisitorsKpi } from "@/components/overview/KpiCards";
import { SummaryCard } from "@/components/overview/SummaryCard";
import { PageHeading } from "@/components/shell/PageHeading";
import { Card } from "@/components/ui/Card";
import { CardSlot } from "@/components/ui/CardSlot";
import { Kpi } from "@/components/ui/Kpi";
import { getEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Overview" };

const kpiLoading = (label: string, delay: number) => <Kpi id={`l-${label}`} label={label} value={0} loading delay={delay} />;

export default function Page() {
  return (
    <>
      <PageHeading page="overview" />

      <CardSlot skeleton="text" fallback={<Card loading skeleton="text" />}>
        <SummaryCard />
      </CardSlot>

      <div className="grid grid-cols-3 gap-4 max-[560px]:grid-cols-1">
        <CardSlot fallback={kpiLoading("Visitors", 0)}>
          <VisitorsKpi />
        </CardSlot>
        <CardSlot fallback={kpiLoading("Features", 50)}>
          <FeaturesKpi />
        </CardSlot>
        <CardSlot fallback={kpiLoading("Experiments", 100)}>
          <ExperimentsKpi />
        </CardSlot>
      </div>

      <CardSlot title={`Store · last ${getEnv().STORE_REFRESH_MINUTES} minutes`} delay={80}>
        <StoreCard />
      </CardSlot>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 max-[1080px]:grid-cols-1">
        <CardSlot title="Activity over time" skeleton="chart" delay={100}>
          <ActivityCard />
        </CardSlot>
        <CardSlot title="Top products" subtitle="By add to cart this week" skeleton="list" delay={150}>
          <TopProductsCard />
        </CardSlot>
      </div>

      <div className="grid grid-cols-2 gap-4 max-[820px]:grid-cols-1">
        <CardSlot title="Where visitors come from" skeleton="chart" delay={160}>
          <SourcesCard />
        </CardSlot>
        <CardSlot title="Devices" subtitle="Share of visitors and how often each adds to cart" skeleton="list" delay={190}>
          <DevicesCard />
        </CardSlot>
      </div>
    </>
  );
}
