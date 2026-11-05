import type { db } from "@erp/db";

/**
 * Every tenant-scoped query must carry this context explicitly — there is
 * no ambient "current tenant" global. This makes the required `tenantId`
 * filter visible at every call site instead of hidden behind middleware,
 * and it's the application-level backstop in front of Postgres RLS.
 */
export interface TenantContext {
  tenantId: string;
  userId: string;
  branchId?: string;
}

/** The transaction object passed into db.transaction(async (tx) => ...). */
export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
