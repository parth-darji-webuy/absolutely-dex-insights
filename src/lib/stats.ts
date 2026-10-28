import { fmt } from "./format";
import type { LiftRange } from "@/types";

// Plain-words statistics for two-variant tests. These are indicative, not GrowthBook's official result.

/** Standard normal cumulative distribution (Abramowitz and Stegun 7.1.26). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

type Arm = { people: number; conv: number };

// A Beta(conv + 1, people - conv + 1) belief about each rate: it starts open-minded and sharpens with data.
const beta = (a: Arm) => {
  const n = Math.max(0, a.people);
  const x = Math.min(Math.max(0, a.conv), n);
  const alpha = x + 1;
  const total = n + 2;
  const mean = alpha / total;
  return { mean, variance: (alpha * (total - alpha)) / (total * total * (total + 1)) };
};

/** Chance (0 to 100, whole number) that treatment's true rate beats control's. 50 when nobody has been counted. */
export function chanceToWin(c: Arm, t: Arm): number {
  const a = beta(c);
  const b = beta(t);
  const sd = Math.sqrt(a.variance + b.variance);
  return Math.round(normalCdf((b.mean - a.mean) / sd) * 100);
}

/** Likely range of the true relative lift in %, about 95% of the time. Wide when there is little data. */
export function liftRange(c: Arm, t: Arm): LiftRange {
  const a = beta(c);
  const b = beta(t);
  const ratio = b.mean / a.mean;
  const se = ratio * Math.sqrt(b.variance / (b.mean * b.mean) + a.variance / (a.mean * a.mean));
  const clamp = (v: number) => Math.max(-100, Math.min(1000, Math.round(v)));
  return [clamp((ratio - 1 - 1.96 * se) * 100), clamp((ratio - 1 + 1.96 * se) * 100)];
}

/** People (both variants together) needed to tell the two rates apart reliably, rounded up to 100. Between 200 and 20,000 (2,000 while nobody has reached the goal). */
export function peopleNeeded(rcPct: number, rtPct: number): number {
  // Nobody has reached the goal yet, so there is no rate to size the test from: ask for a round, achievable number.
  if (!(rcPct > 0) && !(rtPct > 0)) return 2000;
  const p = Math.max(0.01, Math.min(0.99, (Math.max(0, rcPct) + Math.max(0, rtPct)) / 200));
  // Smallest gap worth noticing: the gap seen so far, but at least a tenth of the typical rate.
  const delta = Math.max(Math.abs(rtPct - rcPct) / 100, p * 0.1);
  const perVariant = (15.7 * p * (1 - p)) / (delta * delta);
  return Math.max(200, Math.min(20_000, Math.ceil((perVariant * 2) / 100) * 100));
}

export type VerdictInput = {
  chance: number;
  lift: number;
  people: number;
  needed: number;
  /** Fewest people in either variant. */
  smallest: number;
  /** People per day so far; 0 when unknown. */
  pace: number;
  control: string;
  treatment: string;
};

const daysFor = (people: number, pace: number) => (pace > 0 && people > 0 ? Math.ceil(people / pace) : null);

/** [headline, one plain sentence] for the verdict card. */
export function verdict(v: VerdictInput): [string, string] {
  const left = Math.max(0, v.needed - v.people);
  const days = daysFor(left, v.pace);
  const wait = days && days > 60 ? "At the current pace that would take more than two months." : days ? `Roughly ${days} more day${days === 1 ? "" : "s"} of data needed.` : left > 0 ? `About ${fmt(left)} more people needed.` : "It has enough people.";
  if (v.people < 100 || v.smallest < 30)
    return ["Too early to tell.", `Only ${fmt(v.people)} ${v.people === 1 ? "person has" : "people have"} seen this test so far. It needs roughly ${fmt(v.needed)} before the numbers mean much.`];
  if (v.chance >= 95 && v.lift > 0)
    return [`${v.treatment} is winning.`, left > 0 ? `About ${v.chance}% sure. Wait ${days ? `~${days} more day${days === 1 ? "" : "s"} ` : ""}to reach ${fmt(v.needed)} people, then ship it.` : `About ${v.chance}% sure, and it has enough people. You can ship it.`];
  if (v.chance >= 90 && v.lift > 0) return ["Treatment is probably winning.", `About ${v.chance}% sure. ${days && days <= 60 ? `Wait ~${days} more day${days === 1 ? "" : "s"} to be safe.` : "Wait a little longer to be safe."}`];
  if (v.chance <= 5 && v.lift < 0) return [`${v.control} is winning.`, `About ${100 - v.chance}% sure it does better than ${v.treatment}. ${left > 0 ? wait : "It has enough people."}`];
  if (v.chance >= 75 && v.lift > 0) return [`${v.treatment} may be ahead.`, `About ${v.chance}% sure. ${wait}`];
  return ["Too early to tell.", `No clear difference yet (about ${v.chance}% sure that ${v.treatment} is better). ${wait}`];
}

/** Treatment is ahead and the chance is at least 90%. */
export const isLeading = (chance: number, lift: number): boolean => chance >= 90 && lift > 0;
