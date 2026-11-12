import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { purchaseReturns, purchaseReturnLines } from "@erp/db/schema";
import { nextDocNumber } from "../doc-numbers";
import { postMovement } from "../inventory/movements";
import { postPurchaseReturnJournal } from "../accounting/auto-posting";
import type { PurchaseReturnInput } from "./schemas";

export async function createPurchaseReturn(tenantId: string, userId: string, input: PurchaseReturnInput) {
  return db.transaction(async (tx) => {
    const docNumber = await nextDocNumber(
      tx,
      { tenantId, branchId: input.branchId },
      "purchase_return",
      "PRET",
    );

    const [ret] = await tx
      .insert(purchaseReturns)
      .values({
        tenantId,
        branchId: input.branchId,
        warehouseId: input.warehouseId,
        supplierId: input.supplierId,
        grnId: input.grnId,
        docNumber,
        returnDate: input.returnDate,
        reason: input.reason,
        note: input.note,
        createdByUserId: userId,
      })
      .returning();
    if (!ret) throw new Error("Failed to create purchase return");

    let totalCost = 0;
    for (const line of input.lines) {
      await tx.insert(purchaseReturnLines).values({
        returnId: ret.id,
        productVariantId: line.productVariantId,
        qty: line.quantity.toString(),
        unitCost: line.unitCost.toString(),
      });

      const movement = await postMovement(tx, {
        tenantId,
        warehouseId: input.warehouseId,
        productVariantId: line.productVariantId,
        movementType: "purchase_return",
        direction: "out",
        quantity: line.quantity,
        referenceType: "purchase_return",
        referenceId: ret.id,
        note: input.note,
        createdByUserId: userId,
      });
      // The journal uses the warehouse's actual average cost at the time of
      // the return (what postMovement recorded), not the line's unitCost
      // input field — that field only exists to prefill the UI.
      totalCost += line.quantity * Number(movement!.unitCost);
    }

    await postPurchaseReturnJournal(
      tx,
      { tenantId, branchId: input.branchId, userId },
      { returnId: ret.id, returnDate: input.returnDate, totalCost },
    );

    return ret;
  });
}

export async function listPurchaseReturns(tenantId: string) {
  return db.query.purchaseReturns.findMany({
    where: eq(purchaseReturns.tenantId, tenantId),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
    with: { lines: { with: { productVariant: true } }, supplier: true, warehouse: true, grn: true },
  });
}
