import { describe, expect, it } from "vitest";
import { parseFeatures } from "./growthbook";

describe("parseFeatures", () => {
  it("reads experiments, their flag, values and variation names", () => {
    const out = parseFeatures({
      features: {
        "quick-view-enabled": { defaultValue: false, rules: [{ key: "quick-view-ab-test", name: "Quick View A/B Test", variations: [false, true], meta: [{ name: "Control" }, { name: "Treatment" }] }] },
        "enable-quality-assurance": { defaultValue: true },
        "add-to-cart": { rules: [{ force: "x" }, { key: "k", variations: ["control", "treatment"] }] },
      },
    });
    expect(out.flags).toEqual(["quick-view-enabled", "enable-quality-assurance", "add-to-cart"]);
    expect(out.experiments).toEqual([
      { key: "quick-view-ab-test", flag: "quick-view-enabled", values: ["false", "true"], names: ["Control", "Treatment"], name: "Quick View A/B Test" },
      { key: "k", flag: "add-to-cart", values: ['"control"', '"treatment"'], names: [undefined, undefined], name: undefined },
    ]);
  });
  it("copes with anything that isn't the expected shape", () => {
    for (const bad of [null, undefined, 5, "x", [], {}, { features: null }, { features: { a: null } }, { features: { a: { rules: "no" } } }]) {
      expect(parseFeatures(bad).experiments).toEqual([]);
    }
  });
});
