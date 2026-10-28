import { describe, expect, it } from "vitest";
import { parseDetailQuery } from "./api-params";
import { isTrackingTable, TRACKING_TABLES } from "./tables";

const q = (s: string) => new URLSearchParams(s);

describe("parseDetailQuery", () => {
  it.each(TRACKING_TABLES)("accepts %s", (t) => {
    expect(parseDetailQuery(q(`tbl=${t}&id=abc`))).toEqual({ ok: true, table: t, id: "abc" });
  });
  it("rejects any other table, including look-alikes and injection", () => {
    for (const bad of ["User", "Product", "users", "experiment_tracking;DROP TABLE x", "EXPERIMENT_TRACKING", "experiment_tracking ", "", "pg_user"]) {
      const r = parseDetailQuery(q(`tbl=${encodeURIComponent(bad)}&id=abc`));
      expect(r.ok).toBe(false);
    }
    expect(parseDetailQuery(q("id=abc")).ok).toBe(false);
  });
  it("needs an id of 1 to 64 characters", () => {
    expect(parseDetailQuery(q("tbl=theme_toggle_tracking")).ok).toBe(false);
    expect(parseDetailQuery(q("tbl=theme_toggle_tracking&id=")).ok).toBe(false);
    expect(parseDetailQuery(q(`tbl=theme_toggle_tracking&id=${"a".repeat(64)}`)).ok).toBe(true);
    expect(parseDetailQuery(q(`tbl=theme_toggle_tracking&id=${"a".repeat(65)}`))).toEqual({ ok: false, message: "id can be at most 64 characters." });
  });
});

describe("isTrackingTable", () => {
  it("is exact", () => {
    expect(isTrackingTable("quickview_tracking")).toBe(true);
    expect(isTrackingTable("quick_view_tracking")).toBe(false);
    expect(isTrackingTable(null)).toBe(false);
    expect(isTrackingTable(5)).toBe(false);
  });
});
