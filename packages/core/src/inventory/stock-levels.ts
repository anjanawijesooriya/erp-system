import { and, eq, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { productReorderLevels, productVariants, products, stockBalances, warehouses } from "@erp/db/schema";

/** Stock on hand per (warehouse, variant), summed across batches. */
export async function listStockOnHand(tenantId: string, warehouseId?: string) {
  return db
    .select({
      warehouseId: stockBalances.warehouseId,
      warehouseName: warehouses.name,
      productVariantId: stockBalances.productVariantId,
      sku: productVariants.sku,
      productName: products.name,
      quantity: sql<string>`sum(${stockBalances.quantity})`,
      averageCost: sql<string>`
        case when sum(${stockBalances.quantity}) = 0 then 0
        else sum(${stockBalances.quantity} * ${stockBalances.averageCost}) / sum(${stockBalances.quantity})
        end`,
    })
    .from(stockBalances)
    .innerJoin(warehouses, eq(warehouses.id, stockBalances.warehouseId))
    .innerJoin(productVariants, eq(productVariants.id, stockBalances.productVariantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(
        eq(stockBalances.tenantId, tenantId),
        warehouseId ? eq(stockBalances.warehouseId, warehouseId) : undefined,
      ),
    )
    .groupBy(
      stockBalances.warehouseId,
      warehouses.name,
      stockBalances.productVariantId,
      productVariants.sku,
      products.name,
    )
    .orderBy(products.name);
}

/** Items at or below their reorder level for the warehouse they're configured in. */
export async function listLowStock(tenantId: string) {
  const rows = await db
    .select({
      warehouseId: productReorderLevels.warehouseId,
      warehouseName: warehouses.name,
      productVariantId: productReorderLevels.productVariantId,
      sku: productVariants.sku,
      productName: products.name,
      reorderLevel: productReorderLevels.reorderLevel,
      reorderQty: productReorderLevels.reorderQty,
      onHand: sql<string>`coalesce((
        select sum(${stockBalances.quantity}) from ${stockBalances}
        where ${stockBalances.warehouseId} = ${productReorderLevels.warehouseId}
        and ${stockBalances.productVariantId} = ${productReorderLevels.productVariantId}
      ), 0)`,
    })
    .from(productReorderLevels)
    .innerJoin(warehouses, eq(warehouses.id, productReorderLevels.warehouseId))
    .innerJoin(productVariants, eq(productVariants.id, productReorderLevels.productVariantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(productReorderLevels.tenantId, tenantId));

  return rows.filter((r) => Number(r.onHand) <= Number(r.reorderLevel));
}
