import { createHmac, timingSafeEqual } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { channelOrders, channelProductLinks, customers, salesChannels } from "@erp/db/schema";
import { z } from "zod";
import { createSalesOrder } from "../sales/sales-orders";

const inboundOrderSchema = z.object({
  externalOrderId: z.string().min(1),
  branchId: z.string().uuid(),
  customerName: z.string().min(1),
  orderDate: z.string().min(1),
  lines: z.array(z.object({ externalSku: z.string().min(1), quantity: z.coerce.number().positive(), unitPrice: z.coerce.number().nonnegative() })).min(1),
});
export type InboundOrderPayload = z.infer<typeof inboundOrderSchema>;

/** Constant-time HMAC check — the storefront signs its raw JSON body with the channel's webhookSecret. */
export function verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const ONLINE_CUSTOMER_CODE = "ONLINE-STORE";

async function getOrCreateOnlineCustomer(tenantId: string): Promise<typeof customers.$inferSelect> {
  const existing = await db.query.customers.findFirst({
    where: and(eq(customers.tenantId, tenantId), eq(customers.code, ONLINE_CUSTOMER_CODE)),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(customers)
    .values({
      tenantId,
      code: ONLINE_CUSTOMER_CODE,
      name: "Online Store Customers",
      creditLimit: "0",
      creditTermDays: 0,
    })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  // Lost the insert race to a concurrent import — the row now exists.
  const row = await db.query.customers.findFirst({
    where: and(eq(customers.tenantId, tenantId), eq(customers.code, ONLINE_CUSTOMER_CODE)),
  });
  if (!row) throw new Error("Failed to resolve online-store customer");
  return row;
}

/**
 * Turns one inbound storefront order into a real sales order. The buyer
 * never needs to exist as a proper customer record — all online orders
 * post against one shared "Online Store Customers" placeholder, with the
 * actual buyer's name kept on the raw payload (`channelOrders.payload`)
 * for fulfilment, not modelled as a credit-tracked customer.
 *
 * Any SKU that doesn't resolve to a linked product variant fails the
 * *whole* order rather than importing a partial one, and is recorded as
 * `status: "failed"` with the reason — nothing is silently dropped or
 * half-imported.
 *
 * `createSalesOrder` runs its own transaction (it's the same function the
 * ordinary sales-order UI calls), so this isn't itself wrapped in one
 * outer transaction — recording the inbound payload, resolving SKUs and
 * creating the order are sequential steps, each individually atomic, with
 * `channelOrders.status` as the recoverable marker of how far an import
 * got if something fails partway.
 */
export async function importChannelOrder(channelId: string, rawPayload: unknown) {
  const channel = await db.query.salesChannels.findFirst({ where: eq(salesChannels.id, channelId) });
  if (!channel) throw new Error("Sales channel not found");

  const parsed = inboundOrderSchema.safeParse(rawPayload);
  if (!parsed.success) {
    const [row] = await db
      .insert(channelOrders)
      .values({
        tenantId: channel.tenantId,
        channelId,
        externalOrderId: `invalid-${Date.now()}`,
        payload: rawPayload as object,
        status: "failed",
        failureReason: parsed.error.message,
      })
      .returning();
    return row;
  }
  const payload = parsed.data;

  const [channelOrderRow] = await db
    .insert(channelOrders)
    .values({
      tenantId: channel.tenantId,
      channelId,
      externalOrderId: payload.externalOrderId,
      payload,
      status: "received",
    })
    .onConflictDoNothing({ target: [channelOrders.channelId, channelOrders.externalOrderId] })
    .returning();
  if (!channelOrderRow) {
    // Already imported — webhook retried the same order.
    return db.query.channelOrders.findFirst({
      where: and(eq(channelOrders.channelId, channelId), eq(channelOrders.externalOrderId, payload.externalOrderId)),
    });
  }

  const links = await db.query.channelProductLinks.findMany({ where: eq(channelProductLinks.channelId, channelId) });
  const linkBySku = new Map(links.map((l) => [l.externalSku, l.productVariantId]));

  const resolvedLines: { productVariantId: string; quantity: number; unitPrice: number }[] = [];
  for (const line of payload.lines) {
    const productVariantId = linkBySku.get(line.externalSku);
    if (!productVariantId) {
      const [failed] = await db
        .update(channelOrders)
        .set({ status: "failed", failureReason: `No product linked for channel SKU "${line.externalSku}"` })
        .where(eq(channelOrders.id, channelOrderRow.id))
        .returning();
      return failed;
    }
    resolvedLines.push({ productVariantId, quantity: line.quantity, unitPrice: line.unitPrice });
  }

  const onlineCustomer = await getOrCreateOnlineCustomer(channel.tenantId);

  const order = await createSalesOrder(channel.tenantId, channel.createdByUserId, {
    branchId: payload.branchId,
    customerId: onlineCustomer.id,
    orderDate: payload.orderDate,
    note: `Online order ${payload.externalOrderId} — ${payload.customerName}`,
    lines: resolvedLines,
  });

  const [imported] = await db
    .update(channelOrders)
    .set({ status: "imported", salesOrderId: order.id })
    .where(eq(channelOrders.id, channelOrderRow.id))
    .returning();
  return imported;
}

export async function listChannelOrders(tenantId: string) {
  return db.query.channelOrders.findMany({
    where: eq(channelOrders.tenantId, tenantId),
    with: { channel: true, salesOrder: true },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}
