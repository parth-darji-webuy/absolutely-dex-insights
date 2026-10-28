import { AreaChart, BarChart, LiftRange } from "@/components/charts";
import { Card } from "@/components/ui/Card";
import { CardBoundary } from "@/components/ui/CardBoundary";
import { EmptyState } from "@/components/ui/EmptyState";
import { dailyPeople } from "@/lib/dates";
import { expLabels, treatmentColour } from "@/lib/experiment";
import { fmt } from "@/lib/format";
import type { Experiment } from "@/types";
import { Race } from "./Race";

const Swatch = ({ colour, line }: { colour: string; line?: boolean }) => <i className={line ? "h-0.5 w-2.5 rounded-[1px]" : "size-2.5 rounded-[3px]"} style={{ background: colour }} />;

function Legend({ e }: { e: Experiment }) {
  return (
    <div className="flex flex-wrap gap-3.5 text-xs text-text2">
      <span className="inline-flex items-center gap-1.5">
        <Swatch colour="var(--text3)" />
        {e.c.label}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Swatch colour={treatmentColour(e)} />
        {e.t.label}
      </span>
    </div>
  );
}

/** Wraps one card so that if it can't be drawn, only that card shows an error with Retry. */
function Guard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <CardBoundary title={title} subtitle={subtitle}>
      {children}
    </CardBoundary>
  );
}

export function RaceCard({ e }: { e: Experiment }) {
  const title = "The race so far";
  const subtitle = `Each runner goes as far as their ${e.metricShort} · ${fmt(e.people)} of ~${fmt(e.needed)} people in`;
  return (
    <Guard title={title} subtitle={subtitle}>
      <Card title={title} subtitle={subtitle} source={{ tables: ["experiment_tracking", e.mtable].filter(Boolean) }} delay={100}>
        <Race e={e} />
      </Card>
    </Guard>
  );
}

export function ConversionCard({ e }: { e: Experiment }) {
  const title = "Conversion over time";
  const subtitle = `Share of people who ${e.verb}, cumulative`;
  const all = [...e.series.c, ...e.series.t].filter(Number.isFinite);
  const colour = treatmentColour(e);
  return (
    <Guard title={title} subtitle={subtitle}>
      <Card title={title} subtitle={subtitle} source={{ tables: ["experiment_tracking", e.mtable].filter(Boolean) }} delay={120} actions={<Legend e={e} />}>
        {all.length === 0 ? (
          <EmptyState title="Nothing to chart yet" text="The line will start once people have entered the test." />
        ) : (
          <AreaChart
            labels={expLabels(e)}
            series={[
              { key: "c", name: e.c.label, color: "var(--text3)", values: e.series.c, dash: true },
              { key: "t", name: e.t.label, color: colour, values: e.series.t, fill: true, w: 2 },
            ]}
            min={Math.floor(Math.min(...all) - 2)}
            max={Math.ceil(Math.max(...all) + 2)}
            unit="%"
            w={1180}
            h={300}
            label="Conversion over time"
          />
        )}
      </Card>
    </Guard>
  );
}

export function LiftCard({ e }: { e: Experiment }) {
  const title = "How big is the lift?";
  const subtitle = "Likely range of the true lift · indicative";
  return (
    <Guard title={title} subtitle={subtitle}>
      <Card title={title} subtitle={subtitle} source={{ tables: ["GrowthBook results API"] }} delay={140}>
        {e.rc > 0 ? <LiftRange lift={e.lift} range={e.liftCi} lead={e.lead} /> : <EmptyState title="No lift to show yet" text="The control group hasn’t converted yet, so there is nothing to compare with." />}
      </Card>
    </Guard>
  );
}

export function PeoplePerDayCard({ e }: { e: Experiment }) {
  const title = "People per day";
  const subtitle = "New people entering each variant";
  const dp = dailyPeople(e);
  return (
    <Guard title={title} subtitle={subtitle}>
      <Card title={title} subtitle={subtitle} source={{ tables: ["experiment_tracking"] }} delay={160} actions={<Legend e={e} />}>
        {dp.c.length === 0 ? (
          <EmptyState title="No people yet" text="Daily counts will show up once people enter the test." />
        ) : (
          <BarChart
            labels={expLabels(e)}
            series={[
              { name: e.c.label, color: "var(--text3)", values: dp.c, alpha: 0.55 },
              { name: e.t.label, color: treatmentColour(e), values: dp.t },
            ]}
            w={520}
            h={230}
            every={2}
            label="People per day"
          />
        )}
      </Card>
    </Guard>
  );
}
