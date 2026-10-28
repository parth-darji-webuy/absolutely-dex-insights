import { describe, expect, it } from "vitest";
import { signSession, SESSION_TTL_MS, verifySession } from "./session-token";

const SECRET = "test-secret";
const NOW = 1_800_000_000_000;

describe("session token", () => {
  it("round-trips the email", async () => {
    const token = await signSession("a@b.co", SECRET, NOW);
    expect(await verifySession(token, SECRET, NOW + 1000)).toEqual({ email: "a@b.co" });
  });

  it("rejects the wrong secret, a changed payload, a changed signature and junk", async () => {
    const token = await signSession("a@b.co", SECRET, NOW);
    const [body, sig] = token.split(".");
    const forged = btoa(JSON.stringify({ email: "x@y.co", exp: NOW + 1e9 })).replace(/=+$/, "");
    expect(await verifySession(token, "other-secret", NOW)).toBeNull();
    expect(await verifySession(`${forged}.${sig}`, SECRET, NOW)).toBeNull();
    expect(await verifySession(`${body}.${sig.slice(0, -2)}AA`, SECRET, NOW)).toBeNull();
    for (const junk of ["", "abc", "a.b.c", ".", "..", "not base64!.%%%"]) expect(await verifySession(junk, SECRET, NOW)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signSession("a@b.co", SECRET, NOW);
    expect(await verifySession(token, SECRET, NOW + SESSION_TTL_MS - 1)).not.toBeNull();
    expect(await verifySession(token, SECRET, NOW + SESSION_TTL_MS)).toBeNull();
  });

  it("rejects when there is no token or no secret", async () => {
    expect(await verifySession(undefined, SECRET)).toBeNull();
    expect(await verifySession(await signSession("a@b.co", SECRET), undefined)).toBeNull();
  });
});
