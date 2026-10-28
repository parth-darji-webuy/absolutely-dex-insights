import { describe, expect, it } from "vitest";
import { generateEvents } from "@/mocks";
import { journeyOf, journeyText, storedRow, VARIANT_SOURCE } from "./events";

const events = generateEvents(Date.UTC(2026, 9, 28, 12));

describe("events", () => {
  it("tells the hero visitor's journey in order", () => {
    const steps = journeyOf(events, "kT9xQ2mLpA4w").map((e) => journeyText(e)[0]);
    expect(steps).toEqual(["Saw “Buy Now”", "Opened quick view", "Switched to dark mode", "Added Chronos Obsidian Sapphire Watch to cart", "Added to cart from quick view"]);
  });

  it("describes the cart line with size, colour, price and quantity", () => {
    const e = events.find((x) => x.event === "add_to_cart" && x.visitor === "kT9xQ2mLpA4w")!;
    expect(journeyText(e)[1]).toBe("42mm · Obsidian Black · £520 · qty 1");
  });

  it("stores the row as the table does: id, anonymousId, columns, createdAt", () => {
    const e = events.find((x) => x.event === "experiment_exposure")!;
    const row = storedRow(e);
    expect(Object.keys(row).slice(0, 2)).toEqual(["id", "anonymousId"]);
    expect(Object.keys(row).at(-1)).toBe("createdAt");
    expect(row.createdAt).toBe(new Date(e.ts).toISOString());
    expect(JSON.parse(JSON.stringify(row))).toEqual(row);
  });

  it("knows where every event's variant comes from", () => {
    for (const e of events) expect(VARIANT_SOURCE[e.event]).toBeDefined();
  });
});
