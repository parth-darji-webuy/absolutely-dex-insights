import { describe, expect, it } from "vitest";
import { checkCredentials } from "./mock-auth";

const EMAIL = "designerexchange9@gmail.com";
const PW = "correct-horse";

describe("mock auth", () => {
  it("accepts only the one account with the right password", () => {
    expect(checkCredentials(EMAIL, PW, PW)).toBe(true);
    expect(checkCredentials("  DesignerExchange9@Gmail.com ", PW, PW)).toBe(true);
  });

  it("a wrong email and a wrong password look the same", () => {
    expect(checkCredentials("someone@else.com", PW, PW)).toBe(false);
    expect(checkCredentials(EMAIL, "nope", PW)).toBe(false);
    expect(checkCredentials("someone@else.com", "nope", PW)).toBe(false);
  });

  it("refuses everything when no password is configured", () => {
    expect(checkCredentials(EMAIL, "", undefined)).toBe(false);
    expect(checkCredentials(EMAIL, "undefined", undefined)).toBe(false);
    expect(checkCredentials(EMAIL, "", "")).toBe(false);
  });
});
