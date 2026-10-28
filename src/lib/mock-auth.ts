// TEMPORARY sign-in for phases 2-7: one account, checked against an environment variable.
// Replaced by real authentication later. Nothing secret lives in this file.
import { createHash, timingSafeEqual } from "node:crypto";

/** The only account. */
export const ACCOUNT = { name: "Designer Exchange", email: "designerexchange9@gmail.com", role: "Admin" } as const;

const digest = (s: string) => createHash("sha256").update(s).digest();

/**
 * True only for the account's email and the expected password. A wrong email and a wrong
 * password are indistinguishable to the caller. Comparison time doesn't depend on the input.
 */
export function checkCredentials(email: string, password: string, expectedPassword: string | undefined): boolean {
  if (!expectedPassword) return false;
  const emailOk = timingSafeEqual(digest(email.trim().toLowerCase()), digest(ACCOUNT.email));
  const passwordOk = timingSafeEqual(digest(password), digest(expectedPassword));
  return emailOk && passwordOk;
}

/** Reads the expected password from MOCK_AUTH_PASSWORD (see .env.example). */
export const expectedPassword = (): string | undefined => process.env.MOCK_AUTH_PASSWORD || undefined;
