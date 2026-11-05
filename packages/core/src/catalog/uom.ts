import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { unitsOfMeasure } from "@erp/db/schema";
import type { DbTx } from "../tenant-context";
import type { UomInput } from "./schemas";

export async function listUnitsOfMeasure(tenantId: string) {
  return db.query.unitsOfMeasure.findMany({
    where: eq(unitsOfMeasure.tenantId, tenantId),
    orderBy: (uom, { asc }) => [asc(uom.name)],
  });
}

export async function createUnitOfMeasure(tenantId: string, input: UomInput) {
  const [row] = await db
    .insert(unitsOfMeasure)
    .values({ tenantId, name: input.name, code: input.code })
    .returning();
  return row;
}

export async function getOrCreateUomByCode(
  tx: DbTx,
  tenantId: string,
  code: string,
  name?: string,
) {
  const existing = await tx.query.unitsOfMeasure.findFirst({
    where: (uom, { and, eq: eqOp }) => and(eqOp(uom.tenantId, tenantId), eqOp(uom.code, code)),
  });
  if (existing) return existing;

  const [created] = await tx
    .insert(unitsOfMeasure)
    .values({ tenantId, code, name: name ?? code })
    .returning();
  return created;
}
