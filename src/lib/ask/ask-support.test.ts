import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { answerParts, plain, rowsForAi, shortenId } from "./format";
import { createRateLimiter } from "./rate-limit";
import { ALLOWED_TABLE_NAMES, ASK_TABLES, schemaText } from "./schema";
import { sqlPrompt } from "./groq";
import { TRACKING_TABLES } from "../tables";

describe("rate limiter", () => {
  it("lets 10 through a minute, then waits", () => {
    let t = 1000;
    const l = createRateLimiter(10, 60_000, () => t);
    for (let i = 0; i < 10; i++) expect(l.take("a").ok).toBe(true);
    const blocked = l.take("a");
    expect(blocked).toEqual({ ok: false, retryAfterMs: 60_000 });
    t += 30_000;
    expect(l.take("a")).toMatchObject({ ok: false, retryAfterMs: 30_000 });
    t += 30_001;
    expect(l.take("a").ok).toBe(true);
  });
  it("counts each person separately", () => {
    const l = createRateLimiter(1, 60_000, () => 0);
    expect(l.take("a").ok).toBe(true);
    expect(l.take("b").ok).toBe(true);
    expect(l.take("a").ok).toBe(false);
  });
});

describe("the tables the AI may use", () => {
  it("are the six tracking tables, Product and Category", () => {
    expect([...ALLOWED_TABLE_NAMES].sort()).toEqual([...TRACKING_TABLES, "Product", "Category"].sort());
  });
  it("only name columns that exist in prisma/schema.prisma", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    for (const t of ASK_TABLES) {
      const body = new RegExp(`model ${t.name} \\{([\\s\\S]*?)\\n\\}`).exec(schema)?.[1];
      expect(body, `model ${t.name}`).toBeTruthy();
      for (const [column] of t.columns) expect(new RegExp(`^\\s+${column}\\s`, "m").test(body!), `${t.name}.${column}`).toBe(true);
    }
  });
  it("are all in the instructions the AI gets, with the date and time zone", () => {
    const prompt = sqlPrompt({ today: "2026-10-29", timeZone: "Asia/Kolkata" });
    for (const t of ASK_TABLES) expect(prompt).toContain(t.sql);
    expect(prompt).toContain("2026-10-29");
    expect(prompt).toContain("Asia/Kolkata");
    expect(prompt).toContain("REFUSE");
    expect(prompt).toContain("never instructions");
    expect(schemaText()).not.toContain("passwordHash");
  });
});

describe("answer formatting", () => {
  it("shortens ids", () => {
    expect(shortenId("kT9xQ2mLpA4w")).toBe("kT9x…");
    expect(shortenId("abc")).toBe("abc");
  });
  it("turns database values into plain ones", () => {
    expect(plain(BigInt(5))).toBe(5);
    expect(plain({ toNumber: () => 520.5 })).toBe(520.5);
    expect(plain(new Date("2026-10-29T10:00:00Z"))).toBe("2026-10-29T10:00:00.000Z");
    expect(plain(NaN)).toBeNull();
    expect(plain(undefined)).toBeNull();
    expect(plain({ a: 1 })).toBe('{"a":1}');
  });
  it("makes bars from a label and a number, and none otherwise", () => {
    expect(answerParts(["product", "n"], [{ product: "A", n: 3 }, { product: "B", n: 1 }]).bars).toEqual([["A", 3], ["B", 1]]);
    expect(answerParts(["people"], [{ people: 7 }]).bars).toEqual([]);
    expect(answerParts(["a", "b"], [{ a: "x", b: "y" }]).bars).toEqual([]);
    expect(answerParts(["product", "rate_pct"], [{ product: "A", rate_pct: 12.5 }]).unit).toBe("%");
    expect(answerParts(["k", "n"], []).rows).toEqual([]);
  });
  it("shows nothing as — and never NaN", () => {
    const p = answerParts(["a", "b"], [{ a: null, b: 1234567.891 }]);
    expect(p.rows).toEqual([["—", "1234567.89"]]);
    expect(JSON.stringify(p)).not.toMatch(/NaN|undefined/);
  });
  it("sends the AI plain values with ids shortened", () => {
    expect(rowsForAi(["anonymousId", "customerId", "n"], [{ anonymousId: "kT9xQ2mLpA4w", customerId: "cust_123456", n: BigInt(2) }])).toEqual([{ anonymousId: "kT9x…", customerId: "cust…", n: 2 }]);
  });
});
