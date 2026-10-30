import { BarChart, Donut } from "@/components/charts";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getEvents, getEventsPerMinute } from "@/lib/data";
import { fmt } from "@/lib/format";
import { overview, products } from "@/lib/queries";
import { sum } from "@/lib/rng";
import { EventsTable } from "./EventsTable";

export async function PerMinuteCard() {
  const d = await getEventsPerMinute();
  const total = sum(d.series.map((s) => sum(s.values)));
  return (
    <Card title="Events per minute" subtitle={`Last 60 minutes · ${fmt(total)} events · stacked by type`} delay={30}>
      {total === 0 ? (
        <EmptyState title="No events in the last hour" text="Events will show up here as soon as people visit the store." />
      ) : (
        <>
          <div className="mb-2.5 flex flex-wrap gap-3.5 text-xs text-text2">
            {d.series.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <i className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
          <BarChart labels={d.labels} series={d.series} h={210} every={10} fill={0.7} label="Events per minute" />
        </>
      )}
    </Card>
  );
}

export async function EventMixCard() {
  const o = await overview();
  const keys = Object.keys(o.daily) as (keyof typeof o.daily)[];
  const segments = keys.map((k) => ({ label: o.eventMeta[k].short, value: sum(o.daily[k]), color: o.eventMeta[k].c }));
  const total = sum(segments.map((s) => s.value));
  return (
    <Card title="Event mix" subtitle={`This week · ${fmt(total)} rows`} delay={60}>
      {total === 0 ? <EmptyState title="No events this week" /> : <div className="flex justify-center"><Donut segments={segments} size={140} stroke={20} center={fmt(total)} sub="rows" /></div>}
    </Card>
  );
}

export async function LatestEventsCard() {
  const [events, o, p] = await Promise.all([getEvents(), overview(), products()]);
  const days = o.days;
  const weekLabel = days.length ? `${days[0]}${days.length > 1 ? ` – ${days.at(-1)?.split(" ").pop()}` : ""}` : "";
  return <EventsTable events={events} meta={o.eventMeta} qv={p.qv} weekLabel={weekLabel} />;
}
