import { describe, expect, it } from "vitest";
import { buildExperiment } from "./build-experiment";

const days = ["2026-10-06", "2026-10-07", "2026-10-08"];
const input = {
  key: "add-to-cart",
  flag: "add-to-cart",
  name: "Add to Cart",
  control: { label: "Add to Cart", value: "control" },
  treatment: { label: "Buy Now", value: "treatment" },
  status: "Running" as const,
  days,
  start: "Oct 6, 2026",
  counts: {
    people: { 0: { "2026-10-06": 100, "2026-10-07": 100 }, 1: { "2026-10-06": 100, "2026-10-08": 100 } },
    converted: { 0: { "2026-10-06": 10, "2026-10-07": 10 }, 1: { "2026-10-06": 12, "2026-10-08": 12 } },
  },
};

describe("buildExperiment", () => {
  const e = buildExperiment(input);
  it("adds up people and conversions per variant", () => {
    expect([e.c.people, e.c.conv, e.t.people, e.t.conv, e.people]).toEqual([200, 20, 200, 24, 400]);
    expect([e.rc, e.rt]).toEqual([10, 12]);
    expect(e.lift).toBeCloseTo(20, 6);
  });
  it("keeps days with nobody as zero, in step with the chart", () => {
    expect(e.daily).toEqual({ c: [100, 100, 0], t: [100, 0, 100] });
    expect(e.series).toEqual({ c: [10, 10, 0], t: [12, 0, 12] });
    expect(e.days).toBe(3);
  });
  it("fills the fields the pages need", () => {
    expect(e.values).toEqual(["control", "treatment"]);
    expect(e.desc).toBe("Add to Cart vs Buy Now");
    expect(e.mtable).toBe("add_to_cart_tracking");
    expect(e.verb).toBe("added to cart");
    expect(e.verdict).toHaveLength(2);
    expect(e.progress).toBeGreaterThanOrEqual(0);
    expect(e.progress).toBeLessThanOrEqual(100);
  });
  it("uses the What's New goal for the What's New test", () => {
    const w = buildExperiment({ ...input, key: "new-ab-test" });
    expect(w.mtable).toBe("whats_new_tracking");
    expect(w.preview).toBe("whatsnew");
  });
  it("handles a test nobody has entered: zeros, no NaN", () => {
    const empty = buildExperiment({ ...input, days: ["2026-10-29"], counts: { people: { 0: {}, 1: {} }, converted: { 0: {}, 1: {} } } });
    expect(JSON.stringify(empty)).not.toMatch(/NaN|undefined|Infinity|null/);
    expect([empty.people, empty.rc, empty.rt, empty.lift, empty.chance]).toEqual([0, 0, 0, 0, 50]);
    expect(empty.verdict[0]).toBe("Too early to tell.");
    expect(empty.lead).toBe(false);
  });
  it("handles a variant that nobody entered", () => {
    const one = buildExperiment({ ...input, counts: { people: { 0: { "2026-10-06": 40 }, 1: {} }, converted: { 0: { "2026-10-06": 4 }, 1: {} } } });
    expect(JSON.stringify(one)).not.toMatch(/NaN|undefined|Infinity/);
    expect(one.rt).toBe(0);
    expect(one.lift).toBeCloseTo(-100, 6);
  });
});
