import { describe, expect, it } from "vitest";
import { EBY } from "@/mocks";
import { expLabels, liftText, racePositions, remaining, trafficSplit } from "./experiment";

describe("experiment helpers", () => {
  it("labels each day from the start date", () => {
    expect(expLabels(EBY["add-to-cart"])).toEqual(["Oct 6", "Oct 7", "Oct 8", "Oct 9", "Oct 10", "Oct 11", "Oct 12", "Oct 13", "Oct 14", "Oct 15", "Oct 16"]);
    expect(expLabels({ ...EBY["add-to-cart"], start: "nonsense" }).slice(0, 2)).toEqual(["Day 1", "Day 2"]);
  });

  it("flags an uneven traffic split only for add-to-cart", () => {
    const add = trafficSplit(EBY["add-to-cart"]);
    expect([add.c, add.t, add.off]).toEqual([106, 76, true]);
    expect(Object.values(EBY).filter((e) => trafficSplit(e).off).map((e) => e.key)).toEqual(["add-to-cart"]);
  });

  it("has no split when nobody came", () => {
    const e = { ...EBY["theme-toggle-ab-test"], series: { c: [], t: [] }, daily: { c: [], t: [] }, c: { label: "a", people: 0, conv: 0 }, t: { label: "b", people: 0, conv: 0 } };
    expect(trafficSplit(e)).toEqual({ c: 0, t: 0, pc: null, off: false });
  });

  it("keeps runners inside the lane, even with no conversions", () => {
    expect(racePositions({ rc: 0, rt: 0 })).toEqual({ max: 3, c: 3, t: 3 });
    const r = racePositions({ rc: 10, rt: 12 });
    expect(r.max).toBe(18);
    expect(r.t).toBeGreaterThan(r.c);
    expect(r.t).toBeLessThan(95);
  });

  it("writes lifts and shows a dash when there is no baseline", () => {
    expect(liftText({ lift: 20, rc: 10 })).toBe("+20%");
    expect(liftText({ lift: -3.44, rc: 10 })).toBe("−3.4%");
    expect(liftText({ lift: 0, rc: 0 })).toBe("—");
  });

  it("works out what is still needed", () => {
    expect(remaining({ needed: 2600, people: 2000, days: 11 })).toEqual({ people: 600, days: 4 });
    expect(remaining({ needed: 100, people: 200, days: 5 })).toEqual({ people: 0, days: null });
    expect(remaining({ needed: 100, people: 0, days: 0 })).toEqual({ people: 100, days: null });
  });
});
