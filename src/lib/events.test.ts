import { describe, expect, it } from "vitest";
import { makeEvents } from "@/test/fixtures";
import { EVENT_TABLE, journeyText } from "./events";

const events = makeEvents(Date.UTC(2026, 9, 28, 12));
const hero = events.filter((e) => e.visitor === "kT9xQ2mLpA4w").sort((a, b) => a.ts - b.ts);

describe("events", () => {
  it("describes each step of a journey in plain words", () => {
    expect(hero.map((e) => journeyText(e)[0])).toEqual(["Saw “Buy Now”", "Opened quick view", "Switched to dark mode", "Added Chronos Obsidian Sapphire Watch to cart", "Added to cart from quick view"]);
  });

  it("describes the cart line with size, colour, price and quantity", () => {
    const e = events.find((x) => x.event === "add_to_cart" && x.visitor === "kT9xQ2mLpA4w")!;
    expect(journeyText(e)[1]).toBe("42mm · Obsidian Black · £520 · qty 1");
  });

  it("knows which table every event is written to", () => {
    for (const e of events) {
      expect(EVENT_TABLE[e.event]).toBe(e.table);
    }
  });
});
