import type { Metadata } from "next";
import { EventMixCard, LatestEventsCard, PerMinuteCard } from "@/components/events/EventCards";
import { PageHeading } from "@/components/shell/PageHeading";
import { Card } from "@/components/ui/Card";
import { CardSlot } from "@/components/ui/CardSlot";

export const metadata: Metadata = { title: "Events" };

export default function Page() {
  return (
    <>
      <PageHeading page="events" />
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 max-[1080px]:grid-cols-1">
        <CardSlot title="Events per minute" subtitle="Last 60 minutes · stacked by type" delay={30}>
          <PerMinuteCard />
        </CardSlot>
        <CardSlot title="Event mix" subtitle="This week" delay={60}>
          <EventMixCard />
        </CardSlot>
      </div>
      <CardSlot fallback={<Card loading skeleton="table" delay={60} />}>
        <LatestEventsCard />
      </CardSlot>
      <p className="fade text-xs text-text3">Click a row to see the full payload and the visitor’s journey.</p>
    </>
  );
}
