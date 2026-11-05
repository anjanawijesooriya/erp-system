import { and, eq, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { productVariants, products, stockBalances, warehouses } from "@erp/db/schema";

export async function getStockValuation(tenantId: string) {
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
    .where(and(eq(stockBalances.tenantId, tenantId)))
    .groupBy(
      stockBalances.warehouseId,
      warehouses.name,
      stockBalances.productVariantId,
      productVariants.sku,
      products.name,
    )
    .having(sql`sum(${stockBalances.quantity}) > 0`)
    .orderBy(sql`sum(${stockBalances.quantity} * ${stockBalances.averageCost}) desc`);

  const totalValue = rows.reduce((sum, r) => sum + Number(r.value), 0);
  return { rows, totalValue: totalValue.toFixed(2) };
}
