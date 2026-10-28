import { describe, expect, it } from "vitest";
import { ago, clock, fmt, pct } from "./format";

// Expected values were produced by running the prototype's own helpers.
describe("format", () => {
  it("fmt groups thousands and rounds", () => {
    expect(fmt(12480)).toBe("12,480");
    expect(fmt(0)).toBe("0");
    expect(fmt(1.5)).toBe("2");
    expect(fmt(1234567.8)).toBe("1,234,568");
  });

  it("fmt never shows NaN, undefined or -0", () => {
    expect(fmt(NaN)).toBe("0");
    expect(fmt(Infinity)).toBe("0");
    expect(fmt(undefined as unknown as number)).toBe("0");
    expect(fmt(-0.4)).toBe("0");
  });

  it("pct keeps one decimal by default", () => {
    expect(pct(12)).toBe("12.0%");
    expect(pct(12.04)).toBe("12.0%");
    expect(pct(35.6, 0)).toBe("36%");
  });

  it("pct shows — when there is nothing to divide by", () => {
    expect(pct(NaN)).toBe("—");
    expect(pct(Infinity)).toBe("—");
  });

  it("ago picks seconds, minutes or hours", () => {
    const now = 1_800_000_000_000;
    expect([5, 59, 90, 3000, 7200].map((s) => ago(now - s * 1000, now))).toEqual(["5s ago", "59s ago", "2m ago", "50m ago", "2h ago"]);
    expect(ago(now + 5000, now)).toBe("1s ago");
    expect(ago(NaN, now)).toBe("—");
  });

  it("clock is a 24-hour time", () => {
    expect(clock(new Date(2026, 9, 28, 14, 3, 9).getTime())).toBe("14:03:09");
    expect(clock(NaN)).toBe("—");
  });
});
