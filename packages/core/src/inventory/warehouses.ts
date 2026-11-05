import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { warehouses } from "@erp/db/schema";
import type { WarehouseInput } from "./schemas";

export async function listWarehouses(tenantId: string) {
  return db.query.warehouses.findMany({
    where: eq(warehouses.tenantId, tenantId),
    orderBy: (w, { asc }) => [asc(w.name)],
    with: { branch: true },
  });
}

export async function createWarehouse(tenantId: string, input: WarehouseInput) {
  const [row] = await db
    .insert(warehouses)
    .values({ tenantId, branchId: input.branchId, name: input.name, code: input.code })
    .returning();
  return row;
}
