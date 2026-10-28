import { describe, expect, it } from "vitest";
import { paletteItems } from "./palette-items";

const EXPS = [
  { key: "add-to-cart", name: "Add to Cart button text", desc: "“Add to Cart” vs “Buy Now”", status: "Running" },
  { key: "theme-toggle-ab-test", name: "Theme toggle label", desc: "Moon icon only", status: "Running" },
];
const SUGG = ["Which category sells best?"];

describe("palette items", () => {
  it("with nothing typed: suggested questions, then pages, then experiments", () => {
    const items = paletteItems("", EXPS, SUGG);
    expect(items.map((i) => i.group)).toEqual(["Suggested questions", ...Array(6).fill("Go to"), "Experiments", "Experiments"]);
    expect(items[0].href).toBe("/ask?q=Which%20category%20sells%20best%3F");
  });

  it("with a search: Ask comes first, then matches in pages, experiments and questions", () => {
    const items = paletteItems("cart", EXPS, ["How many add to cart today?", "Which category sells best?"]);
    expect(items[0]).toMatchObject({ group: "Ask AI", label: "Ask: “cart”", href: "/ask?q=cart" });
    expect(items.slice(1).map((i) => [i.group, i.label])).toEqual([
      ["Experiments", "Add to Cart button text"],
      ["Suggested questions", "How many add to cart today?"],
    ]);
  });

  it("matches words from an experiment's description, its key and its status", () => {
    expect(paletteItems("buy now", EXPS, []).map((i) => i.label)).toContain("Add to Cart button text");
    expect(paletteItems("theme-toggle", EXPS, []).map((i) => i.label)).toContain("Theme toggle label");
    expect(paletteItems("running", EXPS, []).filter((i) => i.group === "Experiments")).toHaveLength(2);
  });

  it("still offers Ask when nothing matches", () => {
    const items = paletteItems("zzz", EXPS, SUGG);
    expect(items).toHaveLength(1);
    expect(items[0].group).toBe("Ask AI");
  });

  it("works with no experiments loaded yet", () => {
    expect(paletteItems("", [], []).map((i) => i.label)).toEqual(["Overview", "Experiments", "Events", "Products", "Reports", "Ask your data"]);
  });
});
