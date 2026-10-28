import { describe, expect, it } from "vitest";
import { cleanSummary, numbersAreGrounded, type SummaryFacts } from "./overview-summary";

const facts: SummaryFacts = {
  addToCartsThisWeek: 1416,
  addToCartsLastWeek: 1200,
  changePercent: 18,
  visitorsThisWeek: 12480,
  visitorsLastWeek: 11620,
  runningTests: [{ name: "Add to Cart button text", leading: true, chancePercent: 94, liftPercent: 20 }],
};

describe("numbersAreGrounded", () => {
  it("accepts a sentence that only uses the given numbers", () => {
    expect(numbersAreGrounded("Add-to-carts are up 18% to 1,416 this week, led by the Add to Cart test.", facts)).toBe(true);
    expect(numbersAreGrounded("Add-to-carts are up 18.2% on last week.", facts)).toBe(true);
    expect(numbersAreGrounded("It has been a quiet week.", facts)).toBe(true);
    expect(numbersAreGrounded("1 test is running over the last 7 days.", facts)).toBe(true);
  });
  it("refuses a number the AI made up", () => {
    expect(numbersAreGrounded("Add-to-carts are up 25% this week.", facts)).toBe(false);
    expect(numbersAreGrounded("You had 1,500 add-to-carts.", facts)).toBe(false);
    expect(numbersAreGrounded("Revenue reached 9,999.", facts)).toBe(false);
  });
  it("copes with no change figure", () => {
    expect(numbersAreGrounded("1,416 add-to-carts, nothing from last week to compare.", { ...facts, changePercent: null, addToCartsLastWeek: 0 })).toBe(true);
    expect(numbersAreGrounded("Up 18%.", { ...facts, changePercent: null })).toBe(false);
  });
});

describe("cleanSummary", () => {
  it("strips quotes and markdown", () => {
    expect(cleanSummary('"**Add-to-carts** are up 18%."')).toBe("Add-to-carts are up 18%.");
  });
  it("refuses empty, multi-line and very long replies", () => {
    expect(cleanSummary("")).toBeNull();
    expect(cleanSummary("   ")).toBeNull();
    expect(cleanSummary("One.\nTwo.")).toBeNull();
    expect(cleanSummary("x".repeat(261))).toBeNull();
  });
});
