import { describe, expect, it } from "vitest";
import { EXPS } from "@/test/fixtures";
import { dailyPeople, daysBetween, niceDate, presetRange, rangeError, ymd } from "./dates";

// Expected values were produced by running the prototype's own helpers with "today" = 28 Oct 2026.
const today = new Date(2026, 9, 28, 12);
const start = new Date(2026, 8, 1);
const d = (y: number, m: number, day: number) => new Date(y, m, day);

describe("dates", () => {
  it("formats dates", () => {
    expect(niceDate(d(2026, 9, 5))).toBe("05 Oct 2026");
    expect(ymd(d(2026, 0, 9))).toBe("2026-01-09");
  });

  it("daysBetween counts both ends", () => {
    expect(daysBetween(d(2026, 9, 1), d(2026, 9, 1))).toBe(1);
    expect(daysBetween(d(2026, 9, 1), d(2026, 9, 28))).toBe(28);
  });

  it("presetRange", () => {
    const show = (k: Parameters<typeof presetRange>[0]) => presetRange(k, today)?.map(ymd);
    expect(show("7d")).toEqual(["2026-10-22", "2026-10-28"]);
    expect(show("30d")).toEqual(["2026-09-29", "2026-10-28"]);
    expect(show("thisMonth")).toEqual(["2026-10-01", "2026-10-28"]);
    expect(show("lastMonth")).toEqual(["2026-09-01", "2026-09-30"]);
    expect(presetRange("nope" as "7d", today)).toBeNull();
  });

  it("rangeError explains what is wrong, or returns an empty string", () => {
    expect(rangeError(null, null, today, start)).toBe("Choose both a From and a To date.");
    expect(rangeError(d(2026, 9, 5), d(2026, 9, 1), today, start)).toBe("The From date must be on or before the To date.");
    expect(rangeError(d(2026, 9, 1), d(2026, 10, 3), today, start)).toBe("The To date can’t be in the future.");
    expect(rangeError(d(2026, 7, 1), d(2026, 9, 1), today, start)).toBe("Data starts on 01 Sep 2026. Pick a later From date.");
    expect(rangeError(d(2026, 8, 1), d(2026, 9, 28), today, start)).toBe("");
  });

  it("dailyPeople is the experiment's own daily split, and adds up to its people", () => {
    for (const e of EXPS) {
      const dp = dailyPeople(e);
      expect(dp).toBe(e.daily);
      expect(dp.c.reduce((a, b) => a + b, 0)).toBe(e.c.people);
      expect(dp.t.reduce((a, b) => a + b, 0)).toBe(e.t.people);
    }
    expect(dailyPeople(EXPS[0]).c.at(-1)).toBe(106);
  });
});
