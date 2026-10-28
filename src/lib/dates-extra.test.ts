import { describe, expect, it } from "vitest";
import { parseYMD, rangeError } from "./dates";

describe("parseYMD", () => {
  it("reads real dates and rejects the rest", () => {
    expect(parseYMD("2026-10-07")).toEqual(new Date(2026, 9, 7));
    expect(parseYMD("2026-02-30")).toBeNull();
    expect(parseYMD("")).toBeNull();
    expect(parseYMD(null)).toBeNull();
    expect(parseYMD("07/10/2026")).toBeNull();
  });
});

describe("the Last month preset, with today on 28 Oct 2026", () => {
  it("is a valid period", () => {
    expect(rangeError(new Date(2026, 8, 1), new Date(2026, 8, 30), new Date(2026, 9, 28), new Date(2026, 8, 1))).toBe("");
  });
});
