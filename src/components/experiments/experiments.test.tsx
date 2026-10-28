import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActivityChart } from "@/components/overview/ActivityChart";
import { DeviceRows } from "@/components/overview/DeviceRows";
import { FlagsKpi } from "@/components/overview/FlagsKpi";
import { RunCard } from "@/components/overview/RunCard";
import { StoreScene } from "@/components/overview/StoreScene";
import { SummaryBody } from "@/components/overview/NumbersToggle";
import { EXPS, IDLE, RECENT, RECENT_MIN, ZONES } from "@/mocks";
import type { Experiment } from "@/types";
import { ExplainButton } from "./ExplainDrawer";
import { ExperimentCard } from "./ExperimentCard";
import { ExperimentList } from "./ExperimentList";
import { Race } from "./Race";
import { TrafficLine } from "./TrafficLine";
import { VariantCard } from "./VariantCard";
import { VerdictCard } from "./VerdictCard";

const BAD = /NaN|undefined|Infinity|null/;
const html = (el: React.ReactElement) => renderToStaticMarkup(el);

/** A test nobody has entered yet: every division in the page has a zero underneath it. */
const EMPTY: Experiment = {
  ...EXPS[2],
  c: { label: "Plain link", people: 0, conv: 0 },
  t: { label: "Highlighted", people: 0, conv: 0 },
  people: 0,
  rc: 0,
  rt: 0,
  lift: 0,
  progress: 0,
  chance: 0,
  days: 0,
  series: { c: [], t: [] },
};

describe("Experiments page", () => {
  it("shows a chip with a count per status and one card per test", () => {
    const out = html(<ExperimentList experiments={EXPS} />);
    expect(out).toContain("All");
    expect(out).toContain("Running");
    for (const e of EXPS) expect(out).toContain(`/experiments/${e.key}`);
    expect(out).not.toMatch(BAD);
  });

  it("has an empty state when there are no tests", () => {
    expect(html(<ExperimentList experiments={[]} />)).toContain("No experiments yet");
  });

  it("copes with a test nobody has entered yet", () => {
    expect(html(<ExperimentCard e={EMPTY} />)).not.toMatch(BAD);
  });
});

describe("Experiment page pieces", () => {
  it("never print NaN or undefined, for any test or for an empty one", () => {
    for (const e of [...EXPS, EMPTY]) {
      for (const el of [<VerdictCard key="v" e={e} />, <TrafficLine key="t" e={e} />, <Race key="r" e={e} />, <ExplainButton key="x" e={e} />]) expect(html(el)).not.toMatch(BAD);
      if (e.preview !== "quick") for (const side of ["c", "t"] as const) expect(html(<VariantCard e={e} side={side} />)).not.toMatch(BAD);
    }
  });

  it("warns about the traffic split on add-to-cart only", () => {
    const flagged = EXPS.filter((e) => html(<TrafficLine e={e} />).includes("Uneven, check tracking")).map((e) => e.key);
    expect(flagged).toEqual(["add-to-cart"]);
    expect(html(<TrafficLine e={EXPS[0]} />)).toContain("Traffic split 58 / 42");
  });

  it("shows the sample verdict", () => {
    expect(html(<VerdictCard e={EXPS[0]} />)).toContain("Treatment is probably winning.");
  });
});

describe("Overview pieces", () => {
  const store = { zones: ZONES, idle: IDLE };

  it("draws the five stops", () => {
    const out = html(<StoreScene {...store} />);
    for (const z of ZONES) expect(out).toContain(z.label);
    expect(out).not.toMatch(BAD);
  });

  it("draws an empty store without breaking", () => {
    expect(html(<StoreScene zones={[]} idle={[]} />)).not.toMatch(BAD);
  });

  it("shows each running test's last 30 minutes, with zeros when it has none", () => {
    for (const e of EXPS) expect(html(<RunCard e={e} w={RECENT[e.key]} minutes={RECENT_MIN} delay={0} />)).not.toMatch(BAD);
    const out = html(<RunCard e={EXPS[0]} w={{ c: [0, 0], t: [0, 0], mins: [] }} minutes={RECENT_MIN} delay={0} />);
    expect(out).not.toMatch(BAD);
    expect(out).toContain("—");
  });

  it("lists every flag and links it to its test", () => {
    const out = html(<FlagsKpi flags={EXPS.map((e) => ({ key: e.key, flag: e.flag, name: e.name }))} spark={[1, 2]} />);
    expect(out).toContain("Click to see them");
    expect(out).not.toMatch(BAD);
  });

  it("starts with the numbers hidden", () => {
    const out = html(<SummaryBody line="Add-to-cart is up 18%." numbers={<b>1,416</b>} />);
    expect(out).toContain("Show the numbers");
    expect(out).toMatch(/<div[^>]*hidden/);
  });

  it("handles devices with no visitors", () => {
    const rows = [{ label: "Mobile", visitors: 0, addToCarts: 0, color: "red" }];
    const out = html(<DeviceRows rows={rows} total={0} best={null} note={null} />);
    expect(out).not.toMatch(BAD);
    expect(out).toContain("—");
  });

  it("draws the activity chart with no days", () => {
    expect(html(<ActivityChart labels={[]} series={[]} />)).not.toMatch(BAD);
  });
});
