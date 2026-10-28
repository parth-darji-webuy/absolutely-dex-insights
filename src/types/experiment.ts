export type VariantStat = { label: string; people: number; conv: number };

export type ExperimentPreview = "button" | "quick" | "whatsnew" | "theme";

/** What the sample data says about a test, before the derived numbers are added. */
export type ExperimentSeed = {
  key: string;
  flag: string;
  values: [string, string];
  name: string;
  desc: string;
  status: "Running";
  days: number;
  /** e.g. "Oct 6, 2026" */
  start: string;
  needed: number;
  c: VariantStat;
  t: VariantStat;
  chance: number;
  metric: string;
  verb?: string;
  metricShort?: string;
  verdict: [string, string];
  lead: boolean;
  preview: ExperimentPreview;
  series?: { c: number[]; t: number[] };
};

export type Experiment = Omit<ExperimentSeed, "verb" | "metricShort" | "series"> & {
  verb: string;
  metricShort: string;
  series: { c: number[]; t: number[] };
  /** Tracking table the metric is counted from. */
  mtable: string;
  people: number;
  /** Conversion rate (%) of control and treatment. */
  rc: number;
  rt: number;
  /** Relative lift of treatment over control, in %. */
  lift: number;
  progress: number;
};

/** Indicative lift range [low, high] in %, not GrowthBook's official interval. */
export type LiftRange = [number, number];

/** People shown the test each day, per variant. */
export type DailySplit = { c: number[]; t: number[] };

/** Last 30 minutes for one test: [people, conversions] per variant, plus people per minute. */
export type RecentWindow = { c: [number, number]; t: [number, number]; mins: number[] };

export type ReportRow = {
  date: string;
  weekday: string;
  experiment: string;
  flag: string;
  variant: "control" | "treatment";
  label: string;
  people: number;
  converted: number;
  ratePct: string;
  metric: string;
};
