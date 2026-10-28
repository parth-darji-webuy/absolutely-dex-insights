import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/store/client";
import { getEnv } from "./env";
import { withRetry } from "./retry";

export { withRetry };

/** Every query may run for at most this long. The database role has no timeout of its own. */
export const STATEMENT_TIMEOUT_MS = 15_000;

export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

const holder = globalThis as unknown as { storeDb?: PrismaClient };
let client: PrismaClient | undefined;

function createClient() {
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString: getEnv().STORE_DATABASE_URL }) });
}

/** One client for the whole app. In development it survives hot reloads, so connections aren't piled up. */
export function db(): PrismaClient {
  if (process.env.NODE_ENV === "production") return (client ??= createClient());
  return (holder.storeDb ??= createClient());
}

/**
 * Runs queries inside one read-only transaction that starts with a 15-second statement_timeout
 * (SET LOCAL ends with the transaction). Retries once after 1 second on a connection error or timeout. Write SQL only
 * with `tx.$queryRaw` tagged templates and table names from TRACKING_TABLES.
 */
export function runQuery<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return withRetry(() =>
    db().$transaction(
      async (tx) => {
        // Read-only first (it must come before any other statement), so no write can get through even if the role allows one.
        await tx.$executeRaw`SET TRANSACTION READ ONLY`;
        await tx.$executeRaw`SET LOCAL statement_timeout = 15000`;
        return fn(tx);
      },
      // The transaction may wait a little for a connection; the statement timeout above is what limits each query.
      { maxWait: 5_000, timeout: STATEMENT_TIMEOUT_MS + 5_000 },
    ),
  );
}
