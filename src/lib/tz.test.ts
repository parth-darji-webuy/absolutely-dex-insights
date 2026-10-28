import { describe, expect, it } from "vitest";
import { dayLabel, daysFromTo, lastDays, localDay, shiftDay, startLabel, weekdayOf } from "./tz";

describe("days in a time zone", () => {
  it("puts the same moment on different days in different zones", () => {
    const moment = new Date("2026-10-21T23:30:00Z");
    expect(localDay(moment, "UTC")).toBe("2026-10-21");
    expect(localDay(moment, "Asia/Kolkata")).toBe("2026-10-22");
    expect(localDay(moment, "America/Los_Angeles")).toBe("2026-10-21");
  });
  it("moves a day key across month and year ends", () => {
    expect(shiftDay("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDay("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDay("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("lists the last days ending today, oldest first", () => {
    expect(lastDays(3, "UTC", new Date("2026-10-29T10:00:00Z"))).toEqual(["2026-10-27", "2026-10-28", "2026-10-29"]);
    expect(lastDays(0, "UTC")).toEqual([]);
  });
  it("lists every day between two days, and nothing if they are backwards", () => {
    expect(daysFromTo("2026-10-30", "2026-11-02")).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
    expect(daysFromTo("2026-11-02", "2026-10-30")).toEqual([]);
  });
  it("formats labels", () => {
    expect(dayLabel("2026-10-21")).toBe("Oct 21");
    expect(startLabel("2026-10-21")).toBe("Oct 21, 2026");
    expect(weekdayOf("2026-10-21")).toBe(3);
  });
});
