import { setupFor } from "@/config/experiments";
import type { Experiment } from "@/types";
import { sum } from "../rng";
import { chanceToWin, isLeading, liftRange, peopleNeeded, verdict } from "../stats";

export type Counts = {
  /** People who entered each variant on each day ("YYYY-MM-DD" -> number). */
  people: Record<0 | 1, Record<string, number>>;
  /** Of those, how many reached the goal afterwards. */
  converted: Record<0 | 1, Record<string, number>>;
};

type Input = {
  key: string;
  flag: string;
  name: string;
  control: { label: string; value: string };
  treatment: { label: string; value: string };
  status: "Running" | "Stopped";
  /** Every day from the first person to today. */
  days: string[];
  start: string;
  counts: Counts;
};

const at = (m: Record<string, number>, day: string) => m[day] ?? 0;

/** Turns daily counts into everything the Experiments pages show. Pure: no database, no clock. */
export function buildExperiment(i: Input): Experiment {
  const setup = setupFor(i.key);
  const dailyC = i.days.map((d) => at(i.counts.people[0], d));
  const dailyT = i.days.map((d) => at(i.counts.people[1], d));
  const rate = (variant: 0 | 1) => i.days.map((d) => {
    const n = at(i.counts.people[variant], d);
    return n > 0 ? +((at(i.counts.converted[variant], d) / n) * 100).toFixed(1) : 0;
  });
  const cPeople = sum(dailyC);
  const tPeople = sum(dailyT);
  const cConv = sum(i.days.map((d) => at(i.counts.converted[0], d)));
  const tConv = sum(i.days.map((d) => at(i.counts.converted[1], d)));
  const people = cPeople + tPeople;
  const rc = cPeople ? (cConv / cPeople) * 100 : 0;
  const rt = tPeople ? (tConv / tPeople) * 100 : 0;
  const lift = rc ? (rt / rc - 1) * 100 : 0;
  const chance = chanceToWin({ people: cPeople, conv: cConv }, { people: tPeople, conv: tConv });
  const needed = peopleNeeded(rc, rt);
  const days = i.days.length;
  return {
    key: i.key,
    flag: i.flag,
    values: [i.control.value, i.treatment.value],
    name: i.name,
    desc: `${i.control.label} vs ${i.treatment.label}`,
    status: i.status,
    days,
    start: i.start,
    needed,
    c: { label: i.control.label, people: cPeople, conv: cConv },
    t: { label: i.treatment.label, people: tPeople, conv: tConv },
    chance,
    metric: setup.metric,
    verb: setup.verb,
    metricShort: setup.metricShort,
    verdict: verdict({ chance, lift, people, needed, smallest: Math.min(cPeople, tPeople), pace: days > 0 ? people / days : 0, control: i.control.label, treatment: i.treatment.label }),
    lead: isLeading(chance, lift),
    preview: setup.preview,
    series: { c: rate(0), t: rate(1) },
    daily: { c: dailyC, t: dailyT },
    mtable: setup.metricTable,
    people,
    rc,
    rt,
    lift,
    progress: Math.min(100, Math.round((people / needed) * 100)),
    liftCi: liftRange({ people: cPeople, conv: cConv }, { people: tPeople, conv: tConv }),
  };
}
