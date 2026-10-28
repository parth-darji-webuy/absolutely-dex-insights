import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isRetryable, withRetry } from "./retry";

const prismaError = (code: string, message = "boom") => Object.assign(new Error(message), { code });

describe("isRetryable", () => {
  it("retries connection errors and timeouts", () => {
    for (const code of ["P1001", "P1002", "P1008", "P1017", "P2024", "ECONNRESET", "ETIMEDOUT"]) expect(isRetryable(prismaError(code))).toBe(true);
    expect(isRetryable(new Error("Connection terminated unexpectedly"))).toBe(true);
    expect(isRetryable(new Error("fetch failed"))).toBe(true);
    expect(isRetryable(new Error("outer", { cause: prismaError("ECONNREFUSED") }))).toBe(true);
  });

  it("does not retry anything else", () => {
    expect(isRetryable(prismaError("42501", "permission denied for table x"))).toBe(false);
    expect(isRetryable(prismaError("25006", "cannot execute DELETE in a read-only transaction"))).toBe(false);
    expect(isRetryable(prismaError("57014", "canceling statement due to statement timeout"))).toBe(false);
    expect(isRetryable(new Error("canceling statement due to statement timeout"))).toBe(false);
    expect(isRetryable(new Error("syntax error"))).toBe(false);
    expect(isRetryable(null)).toBe(false);
    expect(isRetryable("P1001")).toBe(false);
  });
});

describe("withRetry", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the first answer without waiting", async () => {
    const fn = vi.fn().mockResolvedValue(7);
    expect(await withRetry(fn)).toBe(7);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries once after one second on a connection error", async () => {
    const fn = vi.fn().mockRejectedValueOnce(prismaError("P1001")).mockResolvedValue("ok");
    const p = withRetry(fn);
    await vi.advanceTimersByTimeAsync(999);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await p).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("gives up after one retry", async () => {
    const fn = vi.fn().mockRejectedValue(prismaError("P1001"));
    const p = withRetry(fn).catch((e) => e);
    await vi.advanceTimersByTimeAsync(1000);
    expect(((await p) as { code: string }).code).toBe("P1001");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry other errors", async () => {
    const fn = vi.fn().mockRejectedValue(prismaError("42501", "permission denied"));
    await expect(withRetry(fn)).rejects.toThrow("permission denied");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
