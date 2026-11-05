import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { suppliers } from "@erp/db/schema";
import type { PartyInput } from "./schemas";

export async function listSuppliers(tenantId: string) {
  return db.query.suppliers.findMany({
    where: eq(suppliers.tenantId, tenantId),
    orderBy: (s, { asc }) => [asc(s.name)],
  });
}

export async function createSupplier(tenantId: string, input: PartyInput) {
  const [row] = await db
    .insert(suppliers)
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
