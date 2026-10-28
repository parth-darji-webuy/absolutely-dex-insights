import { describe, expect, it } from "vitest";
import { ADMIN } from "@/config/accounts";
import { checkCredentials } from "./auth";

const PW = "correct-horse-battery";

describe("checkCredentials", () => {
  it("accepts only the Admin's email with the right password", () => {
    expect(checkCredentials(ADMIN.email, PW, PW)).toBe(true);
  });

  it("trims and lowercases the email", () => {
    expect(checkCredentials("  DesignerExchange9@Gmail.com ", PW, PW)).toBe(true);
  });

  it("treats a wrong email, a wrong password and both the same: false", () => {
    expect(checkCredentials("someone@else.com", PW, PW)).toBe(false);
    expect(checkCredentials(ADMIN.email, "password123", PW)).toBe(false);
    expect(checkCredentials("someone@else.com", "password123", PW)).toBe(false);
  });

  it("is case-sensitive and exact about the password", () => {
    expect(checkCredentials(ADMIN.email, PW.toUpperCase(), PW)).toBe(false);
    expect(checkCredentials(ADMIN.email, PW + " ", PW)).toBe(false);
    expect(checkCredentials(ADMIN.email, PW.slice(0, -1), PW)).toBe(false);
  });

  it("copes with empty and very long input", () => {
    expect(checkCredentials("", "", PW)).toBe(false);
    expect(checkCredentials(ADMIN.email, "x".repeat(100_000), PW)).toBe(false);
  });

  it("refuses everything when no password is configured", () => {
    expect(checkCredentials(ADMIN.email, "", undefined)).toBe(false);
    expect(checkCredentials(ADMIN.email, "undefined", undefined)).toBe(false);
    expect(checkCredentials(ADMIN.email, "", "")).toBe(false);
  });
});
