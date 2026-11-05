"use server";

import { revalidatePath } from "next/cache";
import { createSupplier, partyInput } from "@erp/core/parties";
import { importSuppliersFromExcel } from "@erp/core/import";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createSupplierAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.SUPPLIER_MANAGE);

  const parsed = partyInput.safeParse({
    code: formData.get("code") || undefined,
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    taxId: formData.get("taxId") || undefined,
    creditLimit: formData.get("creditLimit") || undefined,
    creditTermDays: formData.get("creditTermDays") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createSupplier(tenantId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create supplier" };
  }

  revalidatePath("/suppliers");
  return {};
}

export async function importSuppliersAction(
  _prevState: { error?: string; summary?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; summary?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.SUPPLIER_MANAGE);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an .xlsx file first." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importSuppliersFromExcel(tenantId, buffer);
  revalidatePath("/suppliers");

  const summary = `${result.created} created, ${result.errors.length} error(s).`;
  if (result.errors.length > 0) {
    const detail = result.errors
      .slice(0, 5)
      .map((e) => `row ${e.row}: ${e.message}`)
      .join(" | ");
    return { summary: `${summary} ${detail}` };
  }
  return { summary };
}
