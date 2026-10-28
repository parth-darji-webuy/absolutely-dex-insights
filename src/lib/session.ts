import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ACCOUNT } from "./mock-auth";
import { SESSION_COOKIE, verifySession } from "./session-token";

export type User = { name: string; email: string; role: "Admin"; initials: string };

const initialsOf = (name: string) =>
  name
    .split(/[ @]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/** The signed-in user, or null. Safe to call anywhere on the server. */
export async function getOptionalUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  // Checking expiry reads the clock, which Next.js only allows once the request is known to be dynamic.
  await connection();
  const session = await verifySession(token, process.env.SESSION_SECRET, Date.now());
  if (!session || session.email !== ACCOUNT.email) return null;
  return { name: ACCOUNT.name, email: ACCOUNT.email, role: ACCOUNT.role, initials: initialsOf(ACCOUNT.name) };
}

/** The signed-in user. Sends signed-out visitors to the sign-in page. */
export async function getCurrentUser(): Promise<User> {
  const user = await getOptionalUser();
  if (!user) redirect("/sign-in");
  return user;
}
