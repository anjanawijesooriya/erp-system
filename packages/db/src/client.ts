import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://erp:erp_dev_password@localhost:55432/erp";

/**
 * Next.js dev mode re-executes module top-level code on every hot reload.
 * Without caching the client on `globalThis`, each reload opened a brand
 * new postgres connection pool that was never closed, and a long dev
 * session eventually exhausted Postgres's max_connections ("sorry, too
 * many clients already") — confirmed as the actual cause of a login
 * failure during Phase 5 development, not an application bug. Caching
 * across reloads (same pattern as the standard Prisma dev-mode advice)
 * fixes it; harmless and unnecessary in a real production process, which
 * only evaluates this module once.
 */
const globalForDb = globalThis as unknown as { __erpQueryClient?: postgres.Sql };

const queryClient = globalForDb.__erpQueryClient ?? postgres(connectionString, { max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__erpQueryClient = queryClient;
}

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
