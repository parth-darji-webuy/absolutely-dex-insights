import { Delta } from "@/components/ui/Delta";
import { Kpi } from "@/components/ui/Kpi";
import { Tag } from "@/components/ui/Tag";
import { experiments, overview } from "@/lib/queries";
import { sum } from "@/lib/rng";
import { FlagsKpi } from "./FlagsKpi";

export async function VisitorsKpi() {
  const o = await overview();
  const total = sum(o.visitors);
  const change = o.visitorsPrevWeek > 0 ? (total / o.visitorsPrevWeek - 1) * 100 : null;
  return (
    <Kpi
      id="k0"
      label="Visitors"
      tip="Distinct anonymousId across all 6 tracking tables"
      value={total}
      foot={<Delta value={change} />}
      spark={o.visitors}
    />
  );
}

export async function FeaturesKpi() {
  const [o, exps] = await Promise.all([overview(), experiments()]);
  return <FlagsKpi flags={exps.map((e) => ({ key: e.key, flag: e.flag, name: e.name }))} spark={o.flagCounts} delay={50} />;
}

export async function ExperimentsKpi() {
  const [o, exps] = await Promise.all([overview(), experiments()]);
  const running = exps.filter((e) => e.status === "Running").length;
  const winners = exps.filter((e) => e.lead).length;
  return (
    <Kpi
      id="k2"
      label="Experiments"
      value={running}
      unit="running"
      href="/experiments"
      delay={100}
      spark={o.runningCounts}
      foot={winners > 0 ? <Tag tone="lead">★ {winners} likely {winners === 1 ? "winner" : "winners"}</Tag> : <Tag>No clear winner yet</Tag>}
    />
  );
}
