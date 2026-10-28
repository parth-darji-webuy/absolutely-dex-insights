import { describe, expect, it } from "vitest";
import { ATC, EBY, EXPS, generateEvents, PRODUCTS, QV, RECENT, SUGGESTIONS, VIS } from "@/mocks";

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

describe("sample data", () => {
  it("keeps the prototype's totals", () => {
    expect(sum(VIS)).toBe(12480);
    expect(sum(ATC)).toBe(1416);
    expect(sum(PRODUCTS.map((p) => p.atc))).toBe(1416);
    expect(sum(PRODUCTS.map((p) => p.qv))).toBe(QV.opened);
    expect(SUGGESTIONS).toHaveLength(4);
  });

  it("derives rates and lift for each experiment", () => {
    expect(EXPS.map((e) => [e.rc, e.rt, e.progress])).toEqual([
      [10, 12, 77],
      [90 / 920 * 100, 96 / 920 * 100, 41],
      [4.015151515151516, 5.984848484848484, 83],
      [4, 5.523809523809524, 70],
    ]);
    expect(EBY["add-to-cart"].lift).toBeCloseTo(20, 9);
    expect(EBY["quick-view-ab-test"].series.c).toEqual([10.8, 10.1, 9.5, 9.5, 9.4, 9.8]);
    expect(sum(RECENT["add-to-cart"].mins)).toBe(49);
  });
});

describe("generateEvents", () => {
  const now = 1_800_000_000_000;

  it("gives the same events every time", () => {
    expect(generateEvents(now)).toEqual(generateEvents(now));
  });

  it("only moves in time with `now`", () => {
    const a = generateEvents(now), b = generateEvents(now + 1000);
    expect(b.map((e) => e.ts - 1000)).toEqual(a.map((e) => e.ts));
    expect(b.map((e) => e.rowId)).toEqual(a.map((e) => e.rowId));
  });

  it("starts with the hero journey and has 45 events, newest first", () => {
    const list = generateEvents(now);
    expect(list).toHaveLength(45);
    expect(list.slice(0, 3).map((e) => [e.id, e.event, e.rowId])).toEqual([
      [6, "add_to_cart", "0dbeb8ff-9c08-493b-8f75-990691214486"],
      [7, "whats_new_clicked", "cvjnql9583cfsntaofcqiro9s"],
      [5, "quick_view_cart", "366e3ef9-e048-48ff-ad49-a057cf094aa7"],
    ]);
    expect(list.map((e) => e.ts)).toEqual([...list.map((e) => e.ts)].sort((a, b) => b - a));
    const hero = list.filter((e) => e.visitor === "kT9xQ2mLpA4w").map((e) => e.event);
    expect(hero).toEqual(["quick_view_cart", "add_to_cart", "theme_toggle", "quick_view_clicked", "experiment_exposure"]);
  });
});
