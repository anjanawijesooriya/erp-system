import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { deliveries, deliveryLines } from "@erp/db/schema";
import { nextDocNumber } from "../doc-numbers";
import { postMovement } from "../inventory/movements";
import { postDeliveryJournal } from "../accounting/auto-posting";
import type { DbTx } from "../tenant-context";
import type { DeliveryInput } from "./schemas";

/**
 * The stock-moving event for a sale, symmetric with GRN on the purchasing
 * side: posts "sales" movements out of the warehouse at whatever the
 * warehouse's current weighted-average cost is (postMovement always costs
 * an "out" movement at the current average, regardless of the invoice's
 * selling price) — this is what later phases' COGS/margin reporting reads.
 */
export async function insertDelivery(tx: DbTx, tenantId: string, userId: string, input: DeliveryInput) {
  const docNumber = await nextDocNumber(tx, { tenantId, branchId: input.branchId }, "delivery", "DO");

  const [delivery] = await tx
    .insert(deliveries)
    .values({
      tenantId,
      branchId: input.branchId,
      warehouseId: input.warehouseId,
      customerId: input.customerId,
      invoiceId: input.invoiceId,
      docNumber,
      deliveryDate: input.deliveryDate,
      note: input.note,
      createdByUserId: userId,
    })
    .returning();
  if (!delivery) throw new Error("Failed to create delivery");

  let totalCost = 0;
  for (const line of input.lines) {
    await tx.insert(deliveryLines).values({
      deliveryId: delivery.id,
      productVariantId: line.productVariantId,
      qty: line.quantity.toString(),
      batchNumber: line.batchNumber,
    });

    const movement = await postMovement(tx, {
      tenantId,
      warehouseId: input.warehouseId,
      productVariantId: line.productVariantId,
      movementType: "sales",
      direction: "out",
      quantity: line.quantity,
      batchNumber: line.batchNumber,
      referenceType: "delivery",
      referenceId: delivery.id,
      createdByUserId: userId,
    });
    totalCost += line.quantity * Number(movement!.unitCost);
  }

  await postDeliveryJournal(
    tx,
    { tenantId, branchId: input.branchId, userId },
    { deliveryId: delivery.id, deliveryDate: input.deliveryDate, totalCost },
  );

  return delivery;
}

export async function createDelivery(tenantId: string, userId: string, input: DeliveryInput) {
  return db.transaction((tx) => insertDelivery(tx, tenantId, userId, input));
}

export async function listDeliveries(tenantId: string) {
  return db.query.deliveries.findMany({
    where: eq(deliveries.tenantId, tenantId),
    orderBy: (d, { desc }) => [desc(d.createdAt)],
    with: { lines: { with: { productVariant: true } }, customer: true, warehouse: true },
  });
}
