// Prisma's codes for "couldn't reach the database", "timed out connecting", "operation timed out",
// "server closed the connection" and "no free connection in the pool".
const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);
const NETWORK_CODES = new Set(["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "EPIPE"]);
const NETWORK_TEXT = /connection (terminated|closed|refused|reset|timeout)|timed out|socket hang up|fetch failed|websocket|ECONN|ETIMEDOUT/i;
// A query that ran too long would only run too long again, so it is not retried.
const STATEMENT_TIMEOUT = /statement timeout|canceling statement/i;

/** True for connection errors and connection timeouts. False for everything else, including a slow query and a permission error. */
export function isRetryable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { code, message, cause } = error as { code?: unknown; message?: unknown; cause?: unknown };
  const text = typeof message === "string" ? message : "";
  if (code === "57014" || STATEMENT_TIMEOUT.test(text)) return false;
  if (typeof code === "string" && (RETRYABLE_CODES.has(code) || NETWORK_CODES.has(code))) return true;
  if (NETWORK_TEXT.test(text)) return true;
  return cause !== undefined && cause !== error && isRetryable(cause);
}

/** Runs `fn`; if it fails with a connection error or timeout, waits `delayMs` and tries once more. */
export async function withRetry<T>(fn: () => Promise<T>, delayMs = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isRetryable(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fn();
  }
}
