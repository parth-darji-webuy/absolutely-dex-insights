import { createHash, timingSafeEqual } from "node:crypto";
import { ADMIN } from "@/config/accounts";

const digest = (s: string) => createHash("sha256").update(s).digest();

/**
 * True only for the Admin's email and the expected password. A wrong email and a wrong password are
 * indistinguishable to the caller, and the comparisons take the same time whatever was typed
 * (both sides are hashed to the same length first).
 */
export function checkCredentials(email: string, password: string, expectedPassword: string | undefined): boolean {
  if (!expectedPassword) return false;
  const emailOk = timingSafeEqual(digest(email.trim().toLowerCase()), digest(ADMIN.email));
  const passwordOk = timingSafeEqual(digest(password), digest(expectedPassword));
  return emailOk && passwordOk;
}
