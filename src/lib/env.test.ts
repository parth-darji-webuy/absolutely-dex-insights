import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "./env";

const GOOD = {
  STORE_DATABASE_URL: "postgresql://user:secret-pw@host.example/db?sslmode=require",
  STORE_DATABASE_URL_UNPOOLED: "postgresql://user:secret-pw@direct.example/db?sslmode=require",
  SESSION_SECRET: "s".repeat(32),
  ADMIN_PASSWORD: "twelve-chars",
  GROWTHBOOK_API_HOST: "https://api.growthbook.io",
  GROWTHBOOK_CLIENT_KEY: "sdk-abc",
  AI_PROVIDER: "none",
  INSIGHTS_TIMEZONE: "Europe/London",
  TRACKING_START: "2026-09-01",
  STORE_REFRESH_MINUTES: "30",
};

const problemsOf = (source: Record<string, string | undefined>) => {
  try {
    parseEnv(source);
  } catch (e) {
    expect(e).toBeInstanceOf(EnvError);
    return (e as InstanceType<typeof EnvError>).problems.map((p) => p.name);
  }
  return [];
};

describe("parseEnv", () => {
  it("accepts a complete set and turns the refresh minutes into a number", () => {
    expect(parseEnv(GOOD).STORE_REFRESH_MINUTES).toBe(30);
  });

  it.each(Object.keys(GOOD).filter((k) => k !== "AI_PROVIDER"))("names %s when it is missing or empty", (name) => {
    expect(problemsOf({ ...GOOD, [name]: undefined })).toEqual([name]);
    expect(problemsOf({ ...GOOD, [name]: "" })).toEqual([name]);
  });

  it("checks the lengths", () => {
    expect(problemsOf({ ...GOOD, SESSION_SECRET: "s".repeat(31) })).toEqual(["SESSION_SECRET"]);
    expect(problemsOf({ ...GOOD, SESSION_SECRET: "s".repeat(32) })).toEqual([]);
    expect(problemsOf({ ...GOOD, ADMIN_PASSWORD: "x".repeat(11) })).toEqual(["ADMIN_PASSWORD"]);
    expect(problemsOf({ ...GOOD, ADMIN_PASSWORD: "x".repeat(12) })).toEqual([]);
  });

  it("only accepts groq or none, and needs a Groq key and model only for groq", () => {
    expect(problemsOf({ ...GOOD, AI_PROVIDER: "openai" })).toEqual(["AI_PROVIDER"]);
    expect(problemsOf({ ...GOOD, AI_PROVIDER: undefined })).toEqual(["AI_PROVIDER"]);
    expect(problemsOf({ ...GOOD, AI_PROVIDER: "groq" })).toEqual(["GROQ_API_KEY", "GROQ_MODEL"]);
    expect(problemsOf({ ...GOOD, AI_PROVIDER: "groq", GROQ_API_KEY: "k", GROQ_MODEL: "llama" })).toEqual([]);
  });

  it("wants a real time zone and a real date", () => {
    expect(problemsOf({ ...GOOD, INSIGHTS_TIMEZONE: "Mars/Olympus" })).toEqual(["INSIGHTS_TIMEZONE"]);
    expect(problemsOf({ ...GOOD, TRACKING_START: "2026-02-30" })).toEqual(["TRACKING_START"]);
    expect(problemsOf({ ...GOOD, TRACKING_START: "1 Sep 2026" })).toEqual(["TRACKING_START"]);
  });

  it("keeps the refresh minutes between 5 and 120", () => {
    for (const ok of ["5", "120"]) expect(problemsOf({ ...GOOD, STORE_REFRESH_MINUTES: ok })).toEqual([]);
    for (const bad of ["4", "121", "abc", "30.5", "-10"]) expect(problemsOf({ ...GOOD, STORE_REFRESH_MINUTES: bad })).toEqual(["STORE_REFRESH_MINUTES"]);
  });

  it("wants URLs for the databases and GrowthBook", () => {
    expect(problemsOf({ ...GOOD, STORE_DATABASE_URL: "not a url" })).toEqual(["STORE_DATABASE_URL"]);
    expect(problemsOf({ ...GOOD, GROWTHBOOK_API_HOST: "api.growthbook.io" })).toEqual(["GROWTHBOOK_API_HOST"]);
  });

  it("lists every bad variable in one line and never shows a value", () => {
    const bad = { ...GOOD, SESSION_SECRET: "short-but-secret", ADMIN_PASSWORD: "tiny-pw", STORE_DATABASE_URL: "nope-secret-pw" };
    let message = "";
    try {
      parseEnv(bad);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain("SESSION_SECRET");
    expect(message).toContain("ADMIN_PASSWORD");
    expect(message).toContain("STORE_DATABASE_URL");
    expect(message).not.toContain("\n");
    for (const secret of ["short-but-secret", "tiny-pw", "nope-secret-pw", "sdk-abc", "twelve-chars"]) expect(message).not.toContain(secret);
  });
});
