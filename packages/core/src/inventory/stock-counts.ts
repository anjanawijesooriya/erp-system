import { and, eq, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { stockBalances, stockCounts, stockCountLines } from "@erp/db/schema";
import { postMovement } from "./movements";
import type { StartStockCountInput } from "./schemas";

/**
 * MVP flow: a single submission captures the system quantity (summed
 * across any batches — stock counts don't track per-batch variance yet),
 * the counted quantity, and immediately posts an adjustment movement for
 * any variance, finalizing the count in the same transaction. A real
 * open → in-progress-count → supervisor-finalizes workflow is a natural
 * follow-up once there's a second person in the loop to approve variances.
 */
export async function submitStockCount(
  tenantId: string,
  userId: string,
  input: StartStockCountInput & { countedQuantities: Record<string, number> },
) {
  return db.transaction(async (tx) => {
    const [count] = await tx
      .insert(stockCounts)
      .values({
        tenantId,
        warehouseId: input.warehouseId,
        note: input.note,
        status: "open",
        createdByUserId: userId,
      })
      .returning();
    if (!count) throw new Error("Failed to create stock count");

    for (const productVariantId of input.productVariantIds) {
      const [systemTotal] = await tx
        .select({ total: sql<string>`coalesce(sum(${stockBalances.quantity}), 0)` })
        .from(stockBalances)
        .where(
          and(
            eq(stockBalances.warehouseId, input.warehouseId),
            eq(stockBalances.productVariantId, productVariantId),
          ),
        );

      const systemQuantity = Number(systemTotal?.total ?? 0);
      const countedQuantity = input.countedQuantities[productVariantId] ?? systemQuantity;

      await tx.insert(stockCountLines).values({
        stockCountId: count.id,
        productVariantId,
        systemQuantity: systemQuantity.toString(),
        countedQuantity: countedQuantity.toString(),
      });

      const variance = countedQuantity - systemQuantity;
      if (Math.abs(variance) > 0.0001) {
        await postMovement(tx, {
          tenantId,
          warehouseId: input.warehouseId,
          productVariantId,
          movementType: "stock_count",
          direction: variance > 0 ? "in" : "out",
          quantity: Math.abs(variance),
          referenceType: "stock_count",
          referenceId: count.id,
          note: `Stock count variance (${input.note ?? "no note"})`,
          createdByUserId: userId,
        });
      }
    }

    const [finalized] = await tx
      .update(stockCounts)
      .set({ status: "finalized", finalizedAt: new Date() })
      .where(eq(stockCounts.id, count.id))
      .returning();

    return finalized ?? count;
  });
}

export async function listStockCounts(tenantId: string) {
  return db.query.stockCounts.findMany({
    where: eq(stockCounts.tenantId, tenantId),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    with: { lines: { with: { productVariant: true } }, warehouse: true },
  });
}
