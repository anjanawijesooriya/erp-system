import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { productVariants, products, stockBalances, stockMovements, warehouses } from "@erp/db/schema";

/** Items with stock on hand but no "sales" movement in the last `daysSinceLastSale` days. */
export async function getDeadStock(tenantId: string, daysSinceLastSale = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysSinceLastSale);
  const cutoffIso = cutoff.toISOString();

  const rows = await db
    .select({
      warehouseId: stockBalances.warehouseId,
      warehouseName: warehouses.name,
      productVariantId: stockBalances.productVariantId,
      sku: productVariants.sku,
      productName: products.name,
      quantity: sql<string>`sum(${stockBalances.quantity})`,
      value: sql<string>`sum(${stockBalances.quantity} * ${stockBalances.averageCost})`,
    })
    .from(stockBalances)
    .innerJoin(warehouses, eq(warehouses.id, stockBalances.warehouseId))
    .innerJoin(productVariants, eq(productVariants.id, stockBalances.productVariantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(
        eq(stockBalances.tenantId, tenantId),
        sql`not exists (
          select 1 from ${stockMovements} sm
          where sm.product_variant_id = ${stockBalances.productVariantId}
          and sm.warehouse_id = ${stockBalances.warehouseId}
          and sm.movement_type = 'sales'
          and sm.created_at >= ${cutoffIso}
        )`,
      ),
    )
    .groupBy(
      stockBalances.warehouseId,
      warehouses.name,
      stockBalances.productVariantId,
      productVariants.sku,
      products.name,
    )
    .having(gt(sql`sum(${stockBalances.quantity})`, 0))
    .orderBy(sql`sum(${stockBalances.quantity} * ${stockBalances.averageCost}) desc`);

  return rows;
}
