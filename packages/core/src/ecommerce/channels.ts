import { randomBytes } from "crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { channelProductLinks, salesChannels, stockBalances } from "@erp/db/schema";
import { z } from "zod";

export const salesChannelInput = z.object({
  name: z.string().min(1),
});

/**
 * `apiKey` identifies the channel on the inbound webhook URL; `webhookSecret`
 * is a shared secret the storefront HMACs its payload with so the webhook
 * can reject forged orders. Both are generated here, never chosen by the caller.
 */
export async function createSalesChannel(tenantId: string, userId: string, name: string) {
  const [row] = await db
    .insert(salesChannels)
    .values({
      tenantId,
      name,
      createdByUserId: userId,
      apiKey: randomBytes(16).toString("hex"),
      webhookSecret: randomBytes(24).toString("hex"),
    })
    .returning();
  return row;
}

export async function listSalesChannels(tenantId: string) {
  return db.query.salesChannels.findMany({
    where: eq(salesChannels.tenantId, tenantId),
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export async function findChannelByApiKey(apiKey: string) {
  return db.query.salesChannels.findFirst({ where: eq(salesChannels.apiKey, apiKey) });
}

export async function deactivateChannel(tenantId: string, channelId: string) {
  const [row] = await db
    .update(salesChannels)
    .set({ isActive: false })
    .where(and(eq(salesChannels.id, channelId), eq(salesChannels.tenantId, tenantId)))
    .returning();
  return row;
}

export async function linkChannelProduct(tenantId: string, channelId: string, productVariantId: string, externalSku: string) {
  const channel = await db.query.salesChannels.findFirst({
    where: and(eq(salesChannels.id, channelId), eq(salesChannels.tenantId, tenantId)),
  });
  if (!channel) throw new Error("Sales channel not found");

  const [row] = await db
    .insert(channelProductLinks)
    .values({ channelId, productVariantId, externalSku })
    .onConflictDoUpdate({
      target: [channelProductLinks.channelId, channelProductLinks.externalSku],
      set: { productVariantId },
    })
    .returning();
  return row;
}

export async function listChannelProductLinks(tenantId: string, channelId: string) {
  const channel = await db.query.salesChannels.findFirst({
    where: and(eq(salesChannels.id, channelId), eq(salesChannels.tenantId, tenantId)),
  });
  if (!channel) throw new Error("Sales channel not found");

  return db.query.channelProductLinks.findMany({
    where: eq(channelProductLinks.channelId, channelId),
    with: { productVariant: true },
  });
}

/**
 * The outbound product feed a storefront polls (authenticated by
 * `apiKey`, not a tenant session) — current price and on-hand quantity
 * for every linked variant, summed across all of the tenant's
 * warehouses.
 */
export async function getChannelProductFeed(apiKey: string) {
  const channel = await findChannelByApiKey(apiKey);
  if (!channel || !channel.isActive) return null;

  const links = await db.query.channelProductLinks.findMany({
    where: eq(channelProductLinks.channelId, channel.id),
    with: { productVariant: true },
  });
  if (links.length === 0) return [];

  const variantIds = links.map((l) => l.productVariantId);
  const stockRows = await db
    .select({ productVariantId: stockBalances.productVariantId, qty: sql<string>`sum(${stockBalances.quantity})` })
    .from(stockBalances)
    .where(inArray(stockBalances.productVariantId, variantIds))
    .groupBy(stockBalances.productVariantId);
  const stockByVariant = new Map(stockRows.map((r) => [r.productVariantId, Number(r.qty)]));

  return links.map((link) => ({
    externalSku: link.externalSku,
    name: link.productVariant.name,
    sellingPrice: Number(link.productVariant.sellingPrice),
    stockOnHand: stockByVariant.get(link.productVariantId) ?? 0,
  }));
}
