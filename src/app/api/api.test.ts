import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: true as boolean,
  store: { minutes: 30 } as unknown,
  detail: null as unknown,
  detailArgs: null as unknown,
  experiment: null as unknown,
  rows: [] as unknown[],
  boom: false,
}));

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/session", () => ({ getCurrentUser: async () => (state.user ? { name: "Designer Exchange", role: "Admin" } : null) }));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ INSIGHTS_TIMEZONE: "UTC", TRACKING_START: "2026-09-01" }) }));
vi.mock("@/lib/data", () => ({
  getStoreLast30: async () => {
    if (state.boom) throw new Error("db down\nsecret details");
    return state.store;
  },
  getExperiment: async () => state.experiment,
  getReportRows: async () => state.rows,
}));
vi.mock("@/lib/store/events", () => ({
  loadEventDetail: async (...args: unknown[]) => {
    state.detailArgs = args;
    return state.detail;
  },
}));
vi.useFakeTimers({ toFake: ["Date"] });
vi.setSystemTime(new Date("2026-10-29T10:00:00Z"));

const { GET: storeGET } = await import("./store/last-30/route");
const { GET: detailGET } = await import("./events/detail/route");
const { GET: reportGET } = await import("./reports/experiment/route");

const req = (path: string) => new Request(`http://localhost${path}`);

beforeEach(() => {
  state.user = true;
  state.detail = null;
  state.experiment = null;
  state.rows = [];
  state.boom = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/store/last-30", () => {
  it("is 401 when not signed in", async () => {
    state.user = false;
    const res = await storeGET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Not signed in." });
  });
  it("returns the numbers, never cached", async () => {
    const res = await storeGET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ minutes: 30 });
  });
  it("says 500 without leaking the database's words", async () => {
    state.boom = true;
    const res = await storeGET();
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
});

describe("GET /api/events/detail", () => {
  it("is 401 when not signed in", async () => {
    state.user = false;
    expect((await detailGET(req("/api/events/detail?tbl=experiment_tracking&id=a"))).status).toBe(401);
  });
  it("is 400 for a table that isn't one of the six, a missing id or an id over 64 characters", async () => {
    for (const q of ["tbl=User&id=a", "tbl=experiment_tracking", "id=a", `tbl=experiment_tracking&id=${"x".repeat(65)}`, "tbl=experiment_tracking;DROP&id=a"]) {
      const res = await detailGET(req(`/api/events/detail?${q}`));
      expect(res.status, q).toBe(400);
    }
    expect(state.detailArgs).toBeNull();
  });
  it("is 404 when the row doesn't exist", async () => {
    const res = await detailGET(req("/api/events/detail?tbl=theme_toggle_tracking&id=nope"));
    expect(res.status).toBe(404);
    expect(state.detailArgs).toEqual(["theme_toggle_tracking", "nope"]);
  });
  it("returns the row and the journey", async () => {
    state.detail = { event: { rowId: "a" }, row: { id: "a" }, journey: { steps: [], earlier: 0 } };
    const res = await detailGET(req("/api/events/detail?tbl=theme_toggle_tracking&id=a"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ row: { id: "a" }, journey: { earlier: 0 } });
  });
});

describe("GET /api/reports/experiment", () => {
  const ok = "/api/reports/experiment?key=quick-view-ab-test&from=2026-10-20&to=2026-10-22";
  const row = { date: "2026-10-21", weekday: "Wed", experiment: "=Evil", flag: "f", variant: "control", label: "Add, to \"Cart\"", people: 3, converted: 1, ratePct: "33.33", metric: "added to cart" };

  it("is 401 when not signed in", async () => {
    state.user = false;
    expect((await reportGET(req(ok))).status).toBe(401);
  });
  it("is 400 with the page's wording for a bad period (the 366-day limit is in report-period.test.ts)", async () => {
    const cases: [string, string][] = [
      ["key=k&from=2026-10-20", "Choose both a From and a To date."],
      ["key=k&from=2026-10-22&to=2026-10-20", "The From date must be on or before the To date."],
      ["key=k&from=2026-10-20&to=2026-10-30", "The To date can’t be in the future."],
      ["key=k&from=2026-08-01&to=2026-10-20", "Data starts on 01 Sep 2026. Pick a later From date."],
    ];
    for (const [q, message] of cases) {
      const res = await reportGET(req(`/api/reports/experiment?${q}`));
      expect(res.status, q).toBe(400);
      expect(await res.json()).toEqual({ error: message });
    }
    expect((await reportGET(req("/api/reports/experiment?from=2026-10-20&to=2026-10-22"))).status).toBe(400);
  });
  it("is 404 for an unknown experiment", async () => {
    expect((await reportGET(req(ok))).status).toBe(404);
  });
  it("is 404 'Not running in this period' when there are no rows", async () => {
    state.experiment = { name: "Quick View" };
    const res = await reportGET(req(ok));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not running in this period" });
  });
  it("returns the CSV: BOM, CRLF, quoted cells, apostrophe before =, and the file name", async () => {
    state.experiment = { name: "Quick View" };
    state.rows = [row];
    const res = await reportGET(req(ok));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="absolutelydex_quick-view-ab-test-daily_2026-10-20_to_2026-10-22.csv"');
    expect(res.headers.get("X-Report-Rows")).toBe("1");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = new TextDecoder().decode(bytes);
    const lines = text.replace(/^﻿/, "").split("\r\n");
    expect(lines[0]).toBe('"Report","Quick View · daily results"');
    expect(lines.some((l) => l === "")).toBe(true);
    expect(lines.at(-1)).toBe('"2026-10-21","Wed","\'=Evil","f","control","Add, to ""Cart""","3","1","33.33","added to cart"');
    expect(text).not.toMatch(/[^\r]\n/);
  });
});
