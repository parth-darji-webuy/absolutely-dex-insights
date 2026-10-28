import { describe, expect, it, vi } from "vitest";
import { answerQuestion, type AskDeps, extractSql, MESSAGES } from "./ask";

const ctx = { today: "2026-10-29", timeZone: "UTC" };
const GOOD = 'SELECT "productName" AS product, COUNT(*) AS add_to_carts FROM add_to_cart_tracking GROUP BY 1 ORDER BY 2 DESC';

function deps(over: Partial<AskDeps> = {}): AskDeps & { run: ReturnType<typeof vi.fn>; sum: ReturnType<typeof vi.fn> } {
  const run = vi.fn(async () => ({ columns: ["product", "add_to_carts"], rows: [{ product: "Watch", add_to_carts: BigInt(68) }, { product: "Earbuds", add_to_carts: BigInt(52) }] }));
  const sum = vi.fn(async () => "The Watch had the most add-to-carts: 68.");
  return { writeSql: async () => GOOD, runSql: run, summarize: sum, ...over, run, sum } as never;
}

describe("answerQuestion", () => {
  it("writes a query, checks it, runs it and explains the rows", async () => {
    const d = deps();
    const r = await answerQuestion("Which product had the most add-to-carts yesterday?", ctx, d);
    expect(r.kind).toBe("answer");
    if (r.kind !== "answer") return;
    expect(r.answer.a).toBe("The Watch had the most add-to-carts: 68.");
    // the SQL shown is the SQL that ran, with the LIMIT added
    expect(d.run).toHaveBeenCalledWith(`${GOOD} LIMIT 200`);
    expect(r.answer.sql).toBe(`${GOOD} LIMIT 200`);
    expect(r.answer.cols).toEqual(["product", "add_to_carts"]);
    expect(r.answer.rows).toEqual([["Watch", "68"], ["Earbuds", "52"]]);
    expect(r.answer.bars).toEqual([["Watch", 68], ["Earbuds", 52]]);
  });

  it("refuses a query that fails the check, and never runs it", async () => {
    for (const sql of ["DELETE FROM experiment_tracking", "DROP TABLE add_to_cart_tracking", "SELECT 1; SELECT 2", "SELECT pg_sleep(30)", 'SELECT * FROM "User"']) {
      const d = deps({ writeSql: async () => sql });
      expect(await answerQuestion("delete every row", ctx, d)).toEqual({ kind: "refused" });
      expect(d.run).not.toHaveBeenCalled();
      expect(d.sum).not.toHaveBeenCalled();
    }
  });

  it("refuses when the AI says REFUSE, or says nothing", async () => {
    for (const reply of ["REFUSE", "refuse.", "  ", ""]) expect(await answerQuestion("x", ctx, deps({ writeSql: async () => reply }))).toEqual({ kind: "refused" });
  });

  it("reads SQL out of a code fence", async () => {
    expect(extractSql("```sql\nSELECT 1\n```")).toBe("SELECT 1");
    expect(extractSql("Here you go:\n```\nSELECT 2\n```")).toBe("SELECT 2");
    expect(extractSql("  SELECT 3  ")).toBe("SELECT 3");
    const d = deps({ writeSql: async () => "```sql\n" + GOOD + "\n```" });
    expect((await answerQuestion("q", ctx, d)).kind).toBe("answer");
  });

  it("says the AI is busy when either AI call fails", async () => {
    expect(await answerQuestion("q", ctx, deps({ writeSql: async () => { throw new Error("429 secret"); } }))).toEqual({ kind: "busy" });
    expect(await answerQuestion("q", ctx, deps({ summarize: async () => { throw new Error("boom"); } }))).toEqual({ kind: "busy" });
    expect(await answerQuestion("q", ctx, deps({ summarize: async () => "   " }))).toEqual({ kind: "busy" });
  });

  it("says the query failed when the database does not answer", async () => {
    expect(await answerQuestion("q", ctx, deps({ runSql: async () => { throw new Error("canceling statement due to statement timeout"); } }))).toEqual({ kind: "failed" });
  });

  it("answers plainly, without the AI, when no rows match", async () => {
    const d = deps({ runSql: async () => ({ columns: [], rows: [] }) });
    const r = await answerQuestion("q", ctx, d);
    expect(r.kind === "answer" && r.answer.a).toContain("no rows matched");
    expect(d.sum).not.toHaveBeenCalled();
  });

  it("shortens visitor ids before the rows go to the AI, but not the numbers", async () => {
    const d = deps({ runSql: async () => ({ columns: ["anonymousId", "n"], rows: [{ anonymousId: "kT9xQ2mLpA4w", n: BigInt(3) }] }) });
    await answerQuestion("who", ctx, d);
    const [, , columns, rows] = d.sum.mock.calls[0] as unknown as [string, string, string[], Record<string, unknown>[]];
    expect(columns).toEqual(["anonymousId", "n"]);
    expect(rows).toEqual([{ anonymousId: "kT9x…", n: 3 }]);
    expect(JSON.stringify(d.sum.mock.calls)).not.toContain("kT9xQ2mLpA4w");
  });

  it("sends at most 50 rows to the AI but shows all of them", async () => {
    const rows = Array.from({ length: 120 }, (_, i) => ({ k: `p${i}`, n: i }));
    const d = deps({ runSql: async () => ({ columns: ["k", "n"], rows }) });
    const r = await answerQuestion("q", ctx, d);
    expect((d.sum.mock.calls[0] as unknown as unknown[][])[3]).toHaveLength(50);
    expect((d.sum.mock.calls[0] as unknown as number[])[4]).toBe(120);
    expect(r.kind === "answer" && r.answer.rows).toHaveLength(120);
    expect(r.kind === "answer" && r.answer.bars).toEqual([]); // too many rows for bars
  });

  it("has the three messages the page shows", () => {
    expect(MESSAGES.refused).toBe("I can only answer questions about the tracked data");
    expect(MESSAGES.busy).toBe("The AI is busy, try again in a minute");
  });
});
