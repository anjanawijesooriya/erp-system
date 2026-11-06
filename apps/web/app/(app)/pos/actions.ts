"use server";

import { revalidatePath } from "next/cache";
import { createPosSale, posSaleInput } from "@erp/core/sales";
import { closeRegister, openRegister } from "@erp/core/pos";
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

export async function openRegisterAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.POS_SELL);

  const branchId = String(formData.get("branchId") ?? "");
  const openingBalance = Number(formData.get("openingBalance"));
  const note = String(formData.get("note") ?? "") || undefined;

  if (!branchId || !Number.isFinite(openingBalance) || openingBalance < 0) {
    return { error: "Branch and a valid opening balance are required." };
  }

  try {
    await openRegister(tenantId, branchId, userId, openingBalance, note);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to open register" };
  }
  revalidatePath("/pos");
  return {};
}

export async function closeRegisterAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.POS_SELL);

  const branchId = String(formData.get("branchId") ?? "");
  const countedBalance = Number(formData.get("countedBalance"));
  const note = String(formData.get("note") ?? "") || undefined;

  if (!branchId || !Number.isFinite(countedBalance) || countedBalance < 0) {
    return { error: "A valid counted balance is required." };
  }

  try {
    await closeRegister(tenantId, branchId, userId, countedBalance, note);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to close register" };
  }
  revalidatePath("/pos");
  return {};
}
