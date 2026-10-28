import { describe, expect, it } from "vitest";
import { checkPeriod, parseReportQuery } from "./report-period";

const ctx = { today: "2026-10-29", trackingStart: "2026-09-01" };
const q = (s: string) => new URLSearchParams(s);

describe("checkPeriod", () => {
  it("accepts a normal period, and a single day", () => {
    expect(checkPeriod("2026-10-01", "2026-10-29", ctx)).toMatchObject({ ok: true, fromKey: "2026-10-01", toKey: "2026-10-29" });
    expect(checkPeriod("2026-10-15", "2026-10-15", ctx).ok).toBe(true);
  });

  it("allows From on TRACKING_START and To today, but not a day outside", () => {
    expect(checkPeriod("2026-09-01", "2026-10-29", ctx).ok).toBe(true);
    expect(checkPeriod("2026-08-31", "2026-10-29", ctx)).toEqual({ ok: false, message: "Data starts on 01 Sep 2026. Pick a later From date." });
    expect(checkPeriod("2026-10-01", "2026-10-30", ctx)).toEqual({ ok: false, message: "The To date can’t be in the future." });
  });

  it("wants From before or on To", () => {
    expect(checkPeriod("2026-10-10", "2026-10-09", ctx)).toEqual({ ok: false, message: "The From date must be on or before the To date." });
  });

  it("allows 366 days and not 367", () => {
    const wide = { today: "2028-01-01", trackingStart: "2026-09-01" };
    expect(checkPeriod("2027-01-01", "2027-12-31", wide).ok).toBe(true); // 365 days
    expect(checkPeriod("2026-12-31", "2027-12-31", wide).ok).toBe(true); // 366 days
    expect(checkPeriod("2026-12-30", "2027-12-31", wide)).toEqual({ ok: false, message: "A download covers at most 366 days. Shorten the period." });
  });

  it("rejects missing, empty and made-up dates", () => {
    for (const [f, t] of [[null, "2026-10-01"], ["2026-10-01", null], ["", ""], ["2026-02-30", "2026-10-01"], ["01/10/2026", "2026-10-29"], ["2026-10-1", "2026-10-29"], ["yesterday", "today"], [undefined, undefined]] as const) {
      expect(checkPeriod(f, t, ctx)).toEqual({ ok: false, message: "Choose both a From and a To date." });
    }
  });

  it("copes with a broken setup", () => {
    expect(checkPeriod("2026-10-01", "2026-10-02", { today: "nope", trackingStart: "2026-09-01" }).ok).toBe(false);
  });
});

describe("parseReportQuery", () => {
  it("returns the key and the checked dates", () => {
    expect(parseReportQuery(q("key=quick-view-ab-test&from=2026-10-01&to=2026-10-29"), ctx)).toMatchObject({ ok: true, key: "quick-view-ab-test", fromKey: "2026-10-01", toKey: "2026-10-29" });
  });
  it("needs a key of at most 64 characters", () => {
    expect(parseReportQuery(q("from=2026-10-01&to=2026-10-29"), ctx)).toEqual({ ok: false, message: "key is required." });
    expect(parseReportQuery(q(`key=${"k".repeat(65)}&from=2026-10-01&to=2026-10-29`), ctx).ok).toBe(false);
    expect(parseReportQuery(q(`key=${"k".repeat(64)}&from=2026-10-01&to=2026-10-29`), ctx).ok).toBe(true);
  });
  it("passes the period's message on", () => {
    expect(parseReportQuery(q("key=k&from=2026-10-01"), ctx)).toEqual({ ok: false, message: "Choose both a From and a To date." });
  });
});
