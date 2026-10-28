// The session is a JWT (HS256, signed with SESSION_SECRET) kept in an httpOnly cookie.
// jose runs in the proxy and in server code alike, so both check the same token the same way.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "dex_session";
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

const key = (secret: string) => new TextEncoder().encode(secret);

/** A signed token for `email`, valid for 12 hours from `now` (milliseconds; only tests pass it). */
export async function signSession(email: string, secret: string, now: number = Date.now()): Promise<string> {
  const iat = Math.floor(now / 1000);
  return new SignJWT({ email }).setProtectedHeader({ alg: "HS256" }).setIssuedAt(iat).setExpirationTime(iat + SESSION_TTL_SECONDS).sign(key(secret));
}

/** The email in a valid, unexpired, correctly signed token; otherwise null. Never throws. */
export async function verifySession(token: string | undefined | null, secret: string | undefined | null, now: number = Date.now()): Promise<{ email: string } | null> {
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"], currentDate: new Date(now) });
    return typeof payload.email === "string" ? { email: payload.email } : null;
  } catch {
    return null;
  }
}
