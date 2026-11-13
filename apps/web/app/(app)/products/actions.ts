"use server";

import { revalidatePath } from "next/cache";
import { createProduct, productInput, updateProduct, updateProductInput } from "@erp/core/catalog";
import { importProductsFromExcel } from "@erp/core/import";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createProductAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.PRODUCT_MANAGE);

  const parsed = productInput.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    baseUomCode: formData.get("baseUomCode"),
    tracksBatches: formData.get("tracksBatches") === "true",
    costPrice: formData.get("costPrice") || undefined,
    sellingPrice: formData.get("sellingPrice") || undefined,
    barcode: formData.get("barcode") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createProduct(tenantId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create product" };
  }

  revalidatePath("/products");
  return {};
}

export async function updateProductAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.PRODUCT_MANAGE);

  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) {
    return { error: "Missing product." };
  }

  const parsed = updateProductInput.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    tracksBatches: formData.get("tracksBatches") === "true",
    isActive: formData.get("isActive") === "true",
    costPrice: formData.get("costPrice") || undefined,
    sellingPrice: formData.get("sellingPrice") || undefined,
    barcode: formData.get("barcode") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await updateProduct(tenantId, productId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update product" };
  }

  revalidatePath("/products");
  return {};
}

export async function importProductsAction(
  _prevState: { error?: string; summary?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; summary?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.PRODUCT_MANAGE);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an .xlsx file first." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importProductsFromExcel(tenantId, buffer);

  revalidatePath("/products");

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
