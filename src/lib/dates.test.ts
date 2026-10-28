import { describe, expect, it } from "vitest";
import { EXPS } from "@/mocks";
import { dailyPeople, daysBetween, eachDay, expDay, hms, niceDate, presetRange, rangeError, splitTotal, ymd } from "./dates";

// Expected values were produced by running the prototype's own helpers with "today" = 28 Oct 2026.
const today = new Date(2026, 9, 28, 12);
const d = (y: number, m: number, day: number) => new Date(y, m, day);

describe("dates", () => {
  it("formats dates and times", () => {
    expect(niceDate(d(2026, 9, 5))).toBe("05 Oct 2026");
    expect(ymd(d(2026, 0, 9))).toBe("2026-01-09");
    expect(hms(new Date(2026, 0, 9, 7, 5, 3))).toBe("07:05:03");
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
    expect(rangeError(null, null, today)).toBe("Choose both a From and a To date.");
    expect(rangeError(d(2026, 9, 5), d(2026, 9, 1), today)).toBe("The From date must be on or before the To date.");
    expect(rangeError(d(2026, 9, 1), d(2026, 10, 3), today)).toBe("The To date can’t be in the future.");
    expect(rangeError(d(2026, 7, 1), d(2026, 9, 1), today)).toBe("Data starts on 01 Sep 2026. Pick a later From date.");
    expect(rangeError(d(2026, 8, 1), d(2026, 9, 28), today)).toBe("");
  });

  it("eachDay lists every day across a month end", () => {
    expect(eachDay(d(2026, 9, 26), d(2026, 10, 2)).map(ymd)).toEqual([
      "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02",
    ]);
    expect(eachDay(d(2026, 9, 5), d(2026, 9, 1))).toEqual([]);
  });

  it("splitTotal is seeded and always adds up", () => {
    expect(splitTotal(1000, 11, 11)).toEqual([85, 86, 89, 78, 103, 108, 79, 103, 80, 84, 105]);
    expect(splitTotal(53, 7, 30)).toEqual([7, 9, 7, 9, 8, 6, 7]);
    expect(splitTotal(0, 3, 1)).toEqual([0, 0, 0]);
    expect(splitTotal(10, 0, 1)).toEqual([]);
  });

  it("dailyPeople uses the hand-set split for add-to-cart, otherwise a seeded one", () => {
    const [addToCart, ...others] = EXPS;
    expect(dailyPeople(addToCart).c.at(-1)).toBe(106);
    expect(dailyPeople(addToCart).t.at(-1)).toBe(76);
    for (const e of others) {
      const dp = dailyPeople(e);
      expect(dp.c.reduce((a, b) => a + b, 0)).toBe(e.c.people);
      expect(dp.t.reduce((a, b) => a + b, 0)).toBe(e.t.people);
    }
  });

  it("expDay reads the daily history, then a steady pace, and nothing outside the test", () => {
    const e = EXPS[0]; // started Oct 6
    expect(expDay(e, d(2026, 9, 5), today)).toBeNull();
    expect(expDay(e, d(2026, 9, 8), today)).toEqual({ c: 86, t: 90 });
    expect(expDay(e, d(2026, 9, 12), today)).toEqual({ c: 92, t: 96 });
    expect(expDay(e, d(2026, 9, 28), today)).toEqual({ c: 85, t: 82 });
    expect(expDay(e, d(2026, 9, 29), today)).toBeNull();
  });
});
