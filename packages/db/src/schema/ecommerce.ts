import { relations } from "drizzle-orm";
import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { productVariants } from "./catalog";
import { salesOrders } from "./sales";
import { users } from "./users";

// --- Phase 9: E-commerce sync -------------------------------------------------------

/**
 * A channel is deliberately generic ("custom"/webhook-based) rather than
 * tied to one named platform's SDK — any storefront (a Shopify/WooCommerce
 * app, or a shop's own site) integrates the same way: it reads the product
 * feed with `apiKey`, and posts new orders to the inbound webhook signed
 * with `webhookSecret`. See packages/core/src/ecommerce/.
 */
export const salesChannels = pgTable(
  "sales_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    apiKey: text("api_key").notNull().unique(),
    webhookSecret: text("webhook_secret").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    // Orders imported from this channel are attributed to whoever set it
    // up — a webhook has no logged-in user of its own.
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sales_channels_tenant_name_idx").on(table.tenantId, table.name)],
);

/** Maps a product variant to however the channel identifies it externally, so an inbound order's SKU resolves to a real variant. */
export const channelProductLinks = pgTable(
  "channel_product_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => salesChannels.id, { onDelete: "cascade" }),
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    externalSku: text("external_sku").notNull(),
    lastPushedAt: timestamp("last_pushed_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("channel_product_links_channel_sku_idx").on(table.channelId, table.externalSku)],
);

export const channelOrderStatusEnum = pgEnum("channel_order_status", ["received", "imported", "failed"]);

/**
 * The raw inbound payload is kept (`payload`) regardless of import
 * outcome — if a SKU can't be resolved the order lands here as "failed"
 * with the reason in `failureReason`, not silently dropped, so it can be
 * retried after fixing the product link.
 */
export const channelOrders = pgTable(
  "channel_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => salesChannels.id, { onDelete: "cascade" }),
    externalOrderId: text("external_order_id").notNull(),
    payload: jsonb("payload").notNull(),
    status: channelOrderStatusEnum("status").notNull().default("received"),
    failureReason: text("failure_reason"),
    salesOrderId: uuid("sales_order_id").references(() => salesOrders.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("channel_orders_channel_external_idx").on(table.channelId, table.externalOrderId)],
);

export const salesChannelsRelations = relations(salesChannels, ({ many }) => ({
  productLinks: many(channelProductLinks),
  orders: many(channelOrders),
}));

export const channelProductLinksRelations = relations(channelProductLinks, ({ one }) => ({
  channel: one(salesChannels, { fields: [channelProductLinks.channelId], references: [salesChannels.id] }),
  productVariant: one(productVariants, {
    fields: [channelProductLinks.productVariantId],
    references: [productVariants.id],
  }),
}));

export const channelOrdersRelations = relations(channelOrders, ({ one }) => ({
  channel: one(salesChannels, { fields: [channelOrders.channelId], references: [salesChannels.id] }),
  salesOrder: one(salesOrders, { fields: [channelOrders.salesOrderId], references: [salesOrders.id] }),
}));
