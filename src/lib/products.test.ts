import { describe, expect, it } from "vitest";
import { CATS, PRODUCTS, QV } from "@/mocks";
import { addRate, coldProducts, heat, ofOpened, overallRate, quickViewInsight } from "./products";

describe("product maths", () => {
  it("finds the two products that are viewed a lot but rarely added", () => {
    expect(coldProducts(PRODUCTS).map((p) => p.short)).toEqual(["LO", "AR"]);
  });

  it("rates are NaN (shown as —) when nothing was viewed", () => {
    expect(addRate({ views: 0, atc: 0 })).toBeNaN();
    expect(overallRate([])).toBeNaN();
    expect(coldProducts([])).toEqual([]);
    expect(ofOpened({ ...QV, opened: 0 }, 5)).toBeNaN();
  });

  it("overall add rate matches the 1,416 add-to-carts", () => {
    expect(PRODUCTS.reduce((n, p) => n + p.atc, 0)).toBe(CATS.reduce((n, [, c]) => n + c, 0));
    expect(overallRate(PRODUCTS)).toBeCloseTo(9.9, 1);
  });

  it("heat colours cool to hot and never go wrong on bad input", () => {
    expect(heat(0)).toBe("hsl(215 70% 55% / 0.08)");
    expect(heat(1)).toBe("hsl(305 70% 60% / 0.63)");
    expect(heat(NaN)).toBe(heat(0));
    expect(heat(7)).toBe(heat(1));
  });
});

describe("quickViewInsight", () => {
  it("says what the prototype says for the sample numbers", () => {
    expect(quickViewInsight(QV)).toBe("More than half of people (55%) close quick view without acting. Add to Cart is the most-used action at 21%, just ahead of Product Detail at 18%.");
  });
  it("copes with nobody opening it", () => {
    expect(quickViewInsight({ ...QV, opened: 0, add: 0, detail: 0, wish: 0, closed: 0 })).toBe("Nobody has opened quick view yet this week.");
  });
  it("copes with nobody acting", () => {
    expect(quickViewInsight({ ...QV, add: 0, detail: 0, wish: 0, closed: 1872 })).toBe("More than half of people (100%) close quick view without acting.");
  });
});
