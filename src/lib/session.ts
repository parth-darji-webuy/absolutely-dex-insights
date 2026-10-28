import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ADMIN } from "@/config/accounts";
import { getEnv } from "./env";
import { SESSION_COOKIE, verifySession } from "./session-token";

export type User = { name: string; email: string; role: "Admin"; initials: string };

const initialsOf = (name: string) =>
  name
    .split(/[ @]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/**
 * The signed-in user, or null when the cookie is missing, invalid or expired. Every server action and
 * API route calls this itself: the proxy only redirects pages, it is not the lock on the data.
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  // Checking expiry reads the clock, which Next.js only allows once the request is known to be dynamic.
  await connection();
  const session = await verifySession(token, getEnv().SESSION_SECRET, Date.now());
  if (!session || session.email !== ADMIN.email) return null;
  return { name: ADMIN.name, email: ADMIN.email, role: ADMIN.role, initials: initialsOf(ADMIN.name) };
}

/** The signed-in user. Sends signed-out visitors to the sign-in page. For pages and layouts. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** For server actions and API routes: stops with an error unless someone is signed in. */
export async function assertSignedIn(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");
  return user;
}
