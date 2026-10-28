import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { signSession, SESSION_TTL_SECONDS, verifySession } from "./session-token";

const SECRET = "test-secret-with-at-least-32-characters";
const NOW = 1_800_000_000_000;

describe("session token", () => {
  it("round-trips the email", async () => {
    const token = await signSession("a@b.co", SECRET, NOW);
    expect(await verifySession(token, SECRET, NOW + 1000)).toEqual({ email: "a@b.co" });
  });

  it("rejects the wrong secret, a changed payload, a changed signature and junk", async () => {
    const token = await signSession("a@b.co", SECRET, NOW);
    const [head, mid, sig] = token.split(".");
    const body = `${head}.${mid}`;
    const forged = btoa(JSON.stringify({ email: "x@y.co", exp: NOW + 1e9 })).replace(/=+$/, "");
    expect(await verifySession(token, "other-secret-that-is-also-long-enough", NOW)).toBeNull();
    expect(await verifySession(`${body.split(".")[0]}.${forged}.${sig}`, SECRET, NOW)).toBeNull();
    expect(await verifySession(`${body}.${sig.slice(0, -2)}AA`, SECRET, NOW)).toBeNull();
    expect(await verifySession(`${head}.${mid}.`, SECRET, NOW)).toBeNull();
    for (const junk of ["", "abc", "a.b.c", ".", "..", "not base64!.%%%"]) expect(await verifySession(junk, SECRET, NOW)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signSession("a@b.co", SECRET, NOW);
    expect(await verifySession(token, SECRET, NOW + SESSION_TTL_SECONDS * 1000 - 1000)).not.toBeNull();
    expect(await verifySession(token, SECRET, NOW + SESSION_TTL_SECONDS * 1000)).toBeNull();
  });

  it("lasts 12 hours", () => {
    expect(SESSION_TTL_SECONDS).toBe(43_200);
  });

  it("rejects a token signed with a different algorithm", async () => {
    const other = await new SignJWT({ email: "a@b.co" }).setProtectedHeader({ alg: "HS512" }).setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
    expect(await verifySession(other, SECRET)).toBeNull();
  });

  it("rejects a token with no email in it", async () => {
    const noEmail = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
    expect(await verifySession(noEmail, SECRET)).toBeNull();
  });

  it("rejects when there is no token or no secret", async () => {
    expect(await verifySession(undefined, SECRET)).toBeNull();
    expect(await verifySession(await signSession("a@b.co", SECRET), undefined)).toBeNull();
  });
});
