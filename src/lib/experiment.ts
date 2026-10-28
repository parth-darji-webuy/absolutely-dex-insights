import type { Experiment } from "@/types";
import { dailyPeople } from "./dates";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** One chart label per day of the test: "Oct 6", "Oct 7"… Falls back to "Day 1" if the start date can't be read. */
export function expLabels(e: Experiment): string[] {
  const n = e.series.c.length;
  const start = new Date(e.start);
  const ok = Number.isFinite(start.getTime());
  return Array.from({ length: n }, (_, i) => {
    if (!ok) return `Day ${i + 1}`;
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return `${MON[d.getMonth()]} ${d.getDate()}`;
  });
}

/** The colour of the treatment line: violet while it leads, blue otherwise. */
export const treatmentColour = (e: Pick<Experiment, "lead">): string => (e.lead ? "var(--accent)" : "var(--c1)");

export type TrafficSplit = {
  /** People who entered control and treatment in the last day of data. */
  c: number;
  t: number;
  /** Control's share in %, or null when nobody came. */
  pc: number | null;
  /** More than 5 points away from the expected 50 / 50. */
  off: boolean;
};

/** Last 24 hours of people per variant, against the 50 / 50 the test expects. */
export function trafficSplit(e: Experiment): TrafficSplit {
  const dp = dailyPeople(e);
  const last = dp.c.length - 1;
  const c = dp.c[last] ?? 0;
  const t = dp.t[last] ?? 0;
  const total = c + t;
  const pc = total > 0 ? (c / total) * 100 : null;
  return { c, t, pc, off: pc !== null && Math.abs(pc - 50) > 5 };
}

/** How far each runner goes in the race: a % along the lane, and the lane's right-hand end in %. */
export function racePositions(e: Pick<Experiment, "rc" | "rt">): { max: number; c: number; t: number } {
  const top = Math.max(e.rc, e.rt, 0);
  const max = Math.ceil(top / 5) * 5 + 3;
  const at = (rate: number) => +(((Math.max(rate, 0) / max) * 92) + 3).toFixed(1);
  return { max, c: at(e.rc), t: at(e.rt) };
}

/** "+20%" / "−3.4%" for a relative lift; "—" when the control rate was zero. */
export function liftText(e: Pick<Experiment, "lift" | "rc">): string {
  if (!(e.rc > 0) || !Number.isFinite(e.lift)) return "—";
  const a = Math.abs(e.lift);
  const digits = a % 1 && a < 10 ? 1 : 0;
  return `${e.lift >= 0 ? "+" : "−"}${a.toFixed(digits)}%`;
}

/** People still needed, and roughly how many days that takes at the pace so far (null if there is no pace). */
export function remaining(e: Pick<Experiment, "needed" | "people" | "days">): { people: number; days: number | null } {
  const people = Math.max(0, e.needed - e.people);
  const pace = e.days > 0 ? e.people / e.days : 0;
  return { people, days: pace > 0 && people > 0 ? Math.ceil(people / pace) : null };
}
