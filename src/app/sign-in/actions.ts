"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ACCOUNT, checkCredentials, expectedPassword } from "@/lib/mock-auth";
import { SESSION_COOKIE, SESSION_TTL_MS, signSession } from "@/lib/session-token";

export type SignInResult =
  | { ok: true; firstName: string }
  | { ok: false; title: string; detail: string };

/** The same text for a wrong email and a wrong password, so neither is revealed. */
const WRONG = { title: "That email and password don’t match.", detail: "Check them and try again." };

export async function signInAction(email: string, password: string): Promise<SignInResult> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !expectedPassword()) {
    console.error("Sign-in is not set up: copy .env.example to .env.local and restart the dev server.");
    return { ok: false, title: "Sign-in isn’t set up on this computer yet.", detail: "Copy .env.example to .env.local, then restart the dev server." };
  }
  if (!checkCredentials(String(email ?? ""), String(password ?? ""), expectedPassword())) return { ok: false, ...WRONG };

  // "Secure" cookies are skipped by some browsers on plain http://localhost, so only ask for it elsewhere.
  const host = (await headers()).get("host") ?? "";
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  (await cookies()).set(SESSION_COOKIE, await signSession(ACCOUNT.email, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !local,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return { ok: true, firstName: ACCOUNT.name.split(" ")[0] };
}

export async function signOutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/sign-in");
}
