import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { customers } from "@erp/db/schema";
import type { PartyInput } from "./schemas";

const WALK_IN_CUSTOMER_CODE = "WALK-IN";

export async function listCustomers(tenantId: string) {
  return db.query.customers.findMany({
    where: eq(customers.tenantId, tenantId),
    orderBy: (c, { asc }) => [asc(c.name)],
  });
}

export async function createCustomer(tenantId: string, input: PartyInput) {
  const [row] = await db
    .insert(customers)
    .values({
      tenantId,
      code: input.code,
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      address: input.address,
      taxId: input.taxId,
      creditLimit: input.creditLimit.toString(),
      creditTermDays: input.creditTermDays,
    })
    .returning();
  return row;
}

/**
 * POS sales always need a customer record (sales_invoices.customerId is
 * NOT NULL, to avoid nullable-customer branches throughout the sales
 * module) — a walk-in sale with no named customer is attributed to this
 * synthetic per-tenant record instead. 0 credit terms: a walk-in sale's
 * invoice is due the same day.
 */
export async function getOrCreateWalkInCustomer(tenantId: string) {
  const existing = await db.query.customers.findFirst({
    where: and(eq(customers.tenantId, tenantId), eq(customers.code, WALK_IN_CUSTOMER_CODE)),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(customers)
    .values({ tenantId, code: WALK_IN_CUSTOMER_CODE, name: "Walk-in Customer", creditTermDays: 0 })
    .returning();
  if (!created) throw new Error("Failed to create walk-in customer");
  return created;
}
