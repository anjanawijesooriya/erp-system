"use server";

import { revalidatePath } from "next/cache";
import { createPosSale, posSaleInput } from "@erp/core/sales";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function checkoutPosSaleAction(
  _prevState: { error?: string; docNumber?: string; total?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; docNumber?: string; total?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.POS_SELL);

  const linesRaw = formData.get("lines");
  let lines: unknown;
  try {
    lines = JSON.parse(typeof linesRaw === "string" ? linesRaw : "[]");
  } catch {
    return { error: "Invalid cart data." };
  }

  const customerId = formData.get("customerId");
  const parsed = posSaleInput.safeParse({
    branchId: formData.get("branchId"),
    warehouseId: formData.get("warehouseId"),
    customerId: customerId ? customerId : undefined,
    method: formData.get("method"),
    lines,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    const invoice = await createPosSale(tenantId, userId, parsed.data);
    revalidatePath("/inventory");
    revalidatePath("/sales/invoices");
    return { docNumber: invoice.docNumber, total: invoice.totalAmount };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Checkout failed" };
  }
}
