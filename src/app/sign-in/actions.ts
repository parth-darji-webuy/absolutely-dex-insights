"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN } from "@/config/accounts";
import { checkCredentials } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "@/lib/session-token";

export type SignInResult =
  | { ok: true; firstName: string }
  | { ok: false; title: string; detail: string };

/** The same text for a wrong email and a wrong password, so neither is revealed. */
const WRONG = { title: "That email and password don’t match.", detail: "Check them and try again." };

export async function signInAction(email: string, password: string): Promise<SignInResult> {
  const { SESSION_SECRET, ADMIN_PASSWORD } = getEnv();
  if (!checkCredentials(String(email ?? ""), String(password ?? ""), ADMIN_PASSWORD)) return { ok: false, ...WRONG };

  // "Secure" cookies are skipped by some browsers on plain http://localhost, so only ask for it elsewhere.
  const host = (await headers()).get("host") ?? "";
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  (await cookies()).set(SESSION_COOKIE, await signSession(ADMIN.email, SESSION_SECRET), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !local,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return { ok: true, firstName: ADMIN.name.split(" ")[0] };
}

export async function signOutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/sign-in");
}
