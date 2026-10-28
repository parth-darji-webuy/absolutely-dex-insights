import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEvents, getExperiment, getExperiments, getOverview, getProducts, getReportRows, getStoreLast30 } from "./data";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("data", () => {
  it("waits 400 ms before answering", async () => {
    let done = false;
    const p = getOverview().then((o) => ((done = true), o));
    await vi.advanceTimersByTimeAsync(399);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect((await p).days).toHaveLength(7);
  });

  it("returns every page's data", async () => {
    const all = Promise.all([getStoreLast30(), getExperiments(), getExperiment("add-to-cart"), getEvents(), getProducts()]);
    await vi.advanceTimersByTimeAsync(400);
    const [store, exps, one, events, products] = await all;
    expect(store.zones).toHaveLength(5);
    expect(exps).toHaveLength(4);
    expect(one?.name).toBe("Add to Cart button text");
    expect(events).toHaveLength(45);
    expect(products.products).toHaveLength(5);
  });

  it("an unknown experiment is null, and has no report rows", async () => {
    const p = Promise.all([getExperiment("nope"), getReportRows("nope", new Date(2026, 9, 1), new Date(2026, 9, 7))]);
    await vi.advanceTimersByTimeAsync(400);
    expect(await p).toEqual([null, []]);
  });

  it("report rows: two per day, control then treatment", async () => {
    const p = getReportRows("add-to-cart", new Date(2026, 9, 6), new Date(2026, 9, 7));
    await vi.advanceTimersByTimeAsync(400);
    const rows = await p;
    expect(rows.map((r) => [r.date, r.variant, r.people, r.converted, r.ratePct])).toEqual([
      ["2026-10-06", "control", 74, 7, "9.46"],
      ["2026-10-06", "treatment", 76, 9, "11.84"],
      ["2026-10-07", "control", 82, 8, "9.76"],
      ["2026-10-07", "treatment", 86, 10, "11.63"],
    ]);
  });

  it("an empty or backwards period gives no rows", async () => {
    const p = getReportRows("add-to-cart", new Date(2026, 9, 7), new Date(2026, 9, 1));
    await vi.advanceTimersByTimeAsync(400);
    expect(await p).toEqual([]);
  });

  it("hands out copies, so one caller can't change the sample data", async () => {
    const p = getExperiments();
    await vi.advanceTimersByTimeAsync(400);
    (await p)[0].name = "changed";
    const q = getExperiments();
    await vi.advanceTimersByTimeAsync(400);
    expect((await q)[0].name).toBe("Add to Cart button text");
  });
});
