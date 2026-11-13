import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@erp/db";
import { ledgerAccounts } from "@erp/db/schema";

export async function listAccounts(tenantId: string) {
  return db.query.ledgerAccounts.findMany({
    where: eq(ledgerAccounts.tenantId, tenantId),
    orderBy: (a, { asc }) => [asc(a.code)],
  });
}

export const createAccountInput = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  type: z.enum(["asset", "liability", "equity", "income", "expense"]),
});
export type CreateAccountInput = z.infer<typeof createAccountInput>;

/** Tenant-added account, extending the seeded chart of accounts. Never marked `isSystemAccount` — those are reserved for the templates automatic posting targets by code. */
export async function createAccount(tenantId: string, input: CreateAccountInput) {
  const existing = await db.query.ledgerAccounts.findFirst({
    where: and(eq(ledgerAccounts.tenantId, tenantId), eq(ledgerAccounts.code, input.code)),
  });
  if (existing) throw new Error(`An account with code ${input.code} already exists`);

  const [row] = await db
    .insert(ledgerAccounts)
    .values({ tenantId, code: input.code, name: input.name, type: input.type })
    .returning();
  return row;
}
