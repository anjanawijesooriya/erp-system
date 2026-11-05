import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { productReorderLevels } from "@erp/db/schema";
import type { ReorderLevelInput } from "./schemas";

export async function setReorderLevel(tenantId: string, input: ReorderLevelInput) {
  const [row] = await db
    .insert(productReorderLevels)
    .values({
      tenantId,
      warehouseId: input.warehouseId,
      productVariantId: input.productVariantId,
      reorderLevel: input.reorderLevel.toString(),
      reorderQty: input.reorderQty.toString(),
    })
    .onConflictDoUpdate({
      target: [productReorderLevels.warehouseId, productReorderLevels.productVariantId],
      set: { reorderLevel: input.reorderLevel.toString(), reorderQty: input.reorderQty.toString() },
    })
    .returning();
  return row;
}

export async function getReorderLevel(warehouseId: string, productVariantId: string) {
  return db.query.productReorderLevels.findFirst({
    where: and(
      eq(productReorderLevels.warehouseId, warehouseId),
      eq(productReorderLevels.productVariantId, productVariantId),
    ),
  });
}
