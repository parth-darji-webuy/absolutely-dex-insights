// Signed session cookie value: base64url(payload) + "." + base64url(HMAC-SHA256).
// Web Crypto only, so the same code runs in the proxy and in server code.

export const SESSION_COOKIE = "dex_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type Payload = { email: string; exp: number };

const enc = new TextEncoder();
const dec = new TextDecoder();

const toB64Url = (bytes: Uint8Array): string => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromB64Url = (text: string): Uint8Array<ArrayBuffer> => {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const hmacKey = (secret: string) => crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

export async function signSession(email: string, secret: string, now: number = Date.now()): Promise<string> {
  const body = toB64Url(enc.encode(JSON.stringify({ email, exp: now + SESSION_TTL_MS } satisfies Payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body));
  return `${body}.${toB64Url(new Uint8Array(sig))}`;
}

/** The email in a valid, unexpired, correctly signed token; otherwise null. Never throws. */
export async function verifySession(token: string | undefined | null, secret: string | undefined | null, now: number = Date.now()): Promise<{ email: string } | null> {
  if (!token || !secret) return null;
  try {
    const [body, sig, extra] = token.split(".");
    if (!body || !sig || extra !== undefined) return null;
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromB64Url(sig), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(dec.decode(fromB64Url(body))) as Partial<Payload>;
    if (typeof payload.email !== "string" || typeof payload.exp !== "number" || payload.exp <= now) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}
