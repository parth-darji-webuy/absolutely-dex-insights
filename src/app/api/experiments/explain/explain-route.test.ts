import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ user: true, provider: "groq" as "groq" | "none", paragraphs: ["It works."] as string[] | null, known: true }));

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/session", () => ({ getCurrentUser: async () => (state.user ? { email: "admin@example.com" } : null) }));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ AI_PROVIDER: state.provider }) }));
vi.mock("@/lib/data", () => ({ getExperiment: async (key: string) => (state.known ? { key } : null) }));
vi.mock("@/lib/ask/experiment-explain", () => ({ aiExplainExperiment: async () => state.paragraphs }));

const { POST } = await import("./route");
const post = (body: unknown) => POST(new Request("http://localhost/api/experiments/explain", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  state.user = true;
  state.provider = "groq";
  state.paragraphs = ["It works."];
  state.known = true;
});

describe("POST /api/experiments/explain", () => {
  it("answers with the paragraphs", async () => {
    const res = await post({ key: "add-to-cart" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, paragraphs: ["It works."] });
  });
  it("401 when signed out", async () => {
    state.user = false;
    expect((await post({ key: "x" })).status).toBe(401);
  });
  it("503 when AI is off", async () => {
    state.provider = "none";
    expect((await post({ key: "x" })).status).toBe(503);
  });
  it("400 for a missing key, 404 for an unknown one", async () => {
    expect((await post({})).status).toBe(400);
    state.known = false;
    expect((await post({ key: "nope" })).status).toBe(404);
  });
  it("503 when the AI can't answer", async () => {
    state.paragraphs = null;
    expect((await post({ key: "x" })).status).toBe(503);
  });
});
