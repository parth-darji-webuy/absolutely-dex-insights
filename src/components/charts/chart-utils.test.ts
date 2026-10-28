import { describe, expect, it } from "vitest";
import { clamp, linePath, nearestIndex, niceMax, safe, scaleY, spreadX, sumOf } from "./chart-utils";

describe("chart utils", () => {
  it("niceMax rounds up to a friendly axis maximum", () => {
    expect([0.5, 1, 1.5, 2.2, 3, 7, 12, 1060, 4600].map(niceMax)).toEqual([0.5, 1, 2, 2.5, 5, 10, 20, 2000, 5000]);
  });

  it("niceMax gives 1 for zero, negative and broken input", () => {
    expect([0, -4, NaN, Infinity].map(niceMax)).toEqual([1, 1, 1, 1]);
  });

  it("safe turns broken numbers into 0", () => {
    expect([safe(3), safe(NaN), safe(undefined), safe(null), safe(Infinity)]).toEqual([3, 0, 0, 0, 0]);
    expect(sumOf([1, NaN, 2])).toBe(3);
  });

  it("linePath uses one decimal", () => {
    expect(linePath([[0, 1], [2.55, 3]])).toBe("M0.0,1.0L2.5,3.0");
    expect(linePath([])).toBe("");
  });

  it("spreadX and scaleY never divide by zero", () => {
    expect(spreadX(0, 1, 10, 90)).toBe(10);
    expect(spreadX(2, 3, 10, 90)).toBe(90);
    expect(scaleY(5, 5, 5, 0, 100)).toBe(100);
    expect(scaleY(10, 0, 10, 0, 100)).toBe(0);
  });

  it("nearestIndex finds the point under the pointer, and stays in range", () => {
    expect(nearestIndex(46, 5, 46, 14, 760)).toBe(0);
    expect(nearestIndex(10_000, 5, 46, 14, 760)).toBe(4);
    expect(nearestIndex(-50, 5, 46, 14, 760)).toBe(0);
    expect(nearestIndex(400, 1, 46, 14, 760)).toBe(0);
    expect(nearestIndex(100, 4, 40, 10, 400, 87.5)).toBe(0);
    expect(clamp(5, 0, 3)).toBe(3);
  });
});
