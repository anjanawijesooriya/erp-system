"use server";

import { revalidatePath } from "next/cache";
import { createSalesChannel, deactivateChannel, linkChannelProduct } from "@erp/core/ecommerce";
import { db } from "@erp/db";
import { productVariants } from "@erp/db/schema";
import { and, eq } from "drizzle-orm";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { assertModule } from "@erp/core/plans";
import { requireSession } from "@/lib/session";

export async function createChannelAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "ecommerce");
  await assertCan(userId, PERMISSIONS.SALES_CHANNEL_MANAGE);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  await createSalesChannel(tenantId, userId, name);
  revalidatePath("/ecommerce/channels");
  return {};
}

export async function deactivateChannelAction(channelId: string) {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "ecommerce");
  await assertCan(userId, PERMISSIONS.SALES_CHANNEL_MANAGE);
  await deactivateChannel(tenantId, channelId);
  revalidatePath("/ecommerce/channels");
}

export async function linkProductAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "ecommerce");
  await assertCan(userId, PERMISSIONS.SALES_CHANNEL_MANAGE);

  const channelId = String(formData.get("channelId") ?? "");
  const sku = String(formData.get("sku") ?? "").trim();
  const externalSku = String(formData.get("externalSku") ?? "").trim();
  if (!channelId || !sku || !externalSku) return { error: "All fields are required" };

  const variant = await db.query.productVariants.findFirst({
    where: and(eq(productVariants.tenantId, tenantId), eq(productVariants.sku, sku)),
  });
  if (!variant) return { error: `No product variant found for SKU "${sku}"` };

  await linkChannelProduct(tenantId, channelId, variant.id, externalSku);
  revalidatePath("/ecommerce/channels");
  return {};
}
