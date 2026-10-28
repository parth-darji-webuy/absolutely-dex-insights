import { describe, expect, it } from "vitest";
import { chanceToWin, isLeading, liftRange, normalCdf, peopleNeeded, verdict } from "./stats";

describe("normalCdf", () => {
  it("is 0.5 at zero and symmetric", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
  });
});

describe("chanceToWin", () => {
  it("is 50 when the rates are equal, and when nobody has been counted", () => {
    expect(chanceToWin({ people: 1000, conv: 100 }, { people: 1000, conv: 100 })).toBe(50);
    expect(chanceToWin({ people: 0, conv: 0 }, { people: 0, conv: 0 })).toBe(50);
  });
  it("rises with the gap and with the number of people", () => {
    const small = chanceToWin({ people: 100, conv: 10 }, { people: 100, conv: 12 });
    const big = chanceToWin({ people: 1000, conv: 100 }, { people: 1000, conv: 120 });
    expect(small).toBeGreaterThan(50);
    expect(big).toBeGreaterThan(small);
    expect(big).toBeGreaterThan(90);
  });
  it("is low when treatment is worse", () => {
    expect(chanceToWin({ people: 1000, conv: 120 }, { people: 1000, conv: 100 })).toBeLessThan(10);
  });
  it("never returns NaN, even for impossible counts", () => {
    for (const [c, t] of [[{ people: 5, conv: 9 }, { people: -3, conv: -1 }], [{ people: 0, conv: 4 }, { people: 1, conv: 0 }]] as const) expect(Number.isInteger(chanceToWin(c, t))).toBe(true);
  });
});

describe("liftRange", () => {
  it("brackets the observed lift, and is wider with less data", () => {
    const [lo, hi] = liftRange({ people: 1000, conv: 100 }, { people: 1000, conv: 120 });
    expect(lo).toBeLessThan(20);
    expect(hi).toBeGreaterThan(20);
    const [lo2, hi2] = liftRange({ people: 50, conv: 5 }, { people: 50, conv: 6 });
    expect(hi2 - lo2).toBeGreaterThan(hi - lo);
  });
  it("stays within -100 and 1000", () => {
    const [lo, hi] = liftRange({ people: 0, conv: 0 }, { people: 1, conv: 1 });
    expect(lo).toBeGreaterThanOrEqual(-100);
    expect(hi).toBeLessThanOrEqual(1000);
  });
});

describe("peopleNeeded", () => {
  it("asks for 2,000 while nobody has reached the goal", () => {
    expect(peopleNeeded(0, 0)).toBe(2000);
  });
  it("is rounded to 100 and kept between 200 and 20,000", () => {
    for (const [a, b] of [[10, 12], [10, 10], [0.5, 0.6], [50, 51], [1, 0]]) {
      const n = peopleNeeded(a, b);
      expect(n % 100).toBe(0);
      expect(n).toBeGreaterThanOrEqual(200);
      expect(n).toBeLessThanOrEqual(20_000);
    }
  });
  it("needs more people for a smaller gap", () => {
    expect(peopleNeeded(10, 11)).toBeGreaterThan(peopleNeeded(10, 15));
  });
});

const base = { chance: 94, lift: 20, people: 2000, needed: 2600, smallest: 1000, pace: 200, control: "Add to Cart", treatment: "Buy Now" };

describe("verdict", () => {
  it("says it is too early with very few people, and never shows a rate", () => {
    const [h, s] = verdict({ ...base, people: 2, smallest: 1, needed: 2000 });
    expect(h).toBe("Too early to tell.");
    expect(s).toBe("Only 2 people have seen this test so far. It needs roughly 2,000 before the numbers mean much.");
    expect(verdict({ ...base, people: 1, smallest: 0 })[1]).toContain("Only 1 person has");
  });
  it("calls a clear winner, with a wait time", () => {
    expect(verdict({ ...base, chance: 97 })[0]).toBe("Buy Now is winning.");
    expect(verdict(base)).toEqual(["Treatment is probably winning.", "About 94% sure. Wait ~3 more days to be safe."]);
  });
  it("lets control win when treatment is clearly worse", () => {
    expect(verdict({ ...base, chance: 2, lift: -20 })[0]).toBe("Add to Cart is winning.");
  });
  it("is cautious in the middle", () => {
    expect(verdict({ ...base, chance: 80 })[0]).toBe("Buy Now may be ahead.");
    expect(verdict({ ...base, chance: 55, lift: 1 })[0]).toBe("Too early to tell.");
  });
  it("copes with no pace and nothing left to wait for", () => {
    expect(verdict({ ...base, pace: 0, chance: 80 })[1]).toContain("more people needed");
    expect(verdict({ ...base, chance: 99, needed: 1000 })[1]).toContain("You can ship it");
  });
  it("never prints NaN or undefined", () => {
    for (const chance of [0, 33, 50, 80, 92, 99]) for (const lift of [-30, 0, 30]) expect(verdict({ ...base, chance, lift }).join(" ")).not.toMatch(/NaN|undefined/);
  });
});

describe("isLeading", () => {
  it("needs 90% and a positive lift", () => {
    expect(isLeading(94, 20)).toBe(true);
    expect(isLeading(88, 20)).toBe(false);
    expect(isLeading(94, -2)).toBe(false);
  });
});
