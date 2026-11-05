import { relations } from "drizzle-orm";
import { boolean, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

/**
 * A unit of measure a tenant sells or buys in, e.g. "Piece", "Box", "Kg".
 * Conversion between units is per-product (see productUomConversions) since
 * "1 box = 24 pieces" only makes sense for a specific product.
 */
export const unitsOfMeasure = pgTable(
  "units_of_measure",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "Piece"
    code: text("code").notNull(), // e.g. "PCS"
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("uom_tenant_code_idx").on(table.tenantId, table.code)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    baseUomId: uuid("base_uom_id")
      .notNull()
      .references(() => unitsOfMeasure.id, { onDelete: "restrict" }),
    // Pharmacy-style businesses track batch/expiry per stock movement (Phase 3);
    // declared on the product now so Phase 3 doesn't need a backfill migration.
    tracksBatches: boolean("tracks_batches").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("products_tenant_sku_idx").on(table.tenantId, table.sku)],
);

/**
 * Every product has at least one variant, even a product with no real
 * variation (textile size/colour, etc.) — this avoids a separate
 * "simple vs. variant product" code path everywhere else in the system.
 * Pricing, cost and barcode all live on the variant, not the product.
 */
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    name: text("name").notNull(), // e.g. "Default", or "Red / Large"
    attributes: jsonb("attributes"), // e.g. { color: "Red", size: "L" }
    barcode: text("barcode"),
    // Money is numeric, never float/double (build-plan rule #4).
    costPrice: numeric("cost_price", { precision: 14, scale: 4 }).notNull().default("0"),
    sellingPrice: numeric("selling_price", { precision: 14, scale: 4 }).notNull().default("0"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_variants_tenant_sku_idx").on(table.tenantId, table.sku),
    uniqueIndex("product_variants_tenant_barcode_idx").on(table.tenantId, table.barcode),
  ],
);

/**
 * Per-product conversion to the product's base UoM, e.g. product "Cement
 * Bag" has baseUom "Piece" and a conversion row { uom: Box, factor: 24 }
 * meaning 1 Box = 24 Piece. Stock is always held/moved in the base unit;
 * the factor only converts quantities at entry (purchase/sale) time.
 */
export const productUomConversions = pgTable(
  "product_uom_conversions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    uomId: uuid("uom_id")
      .notNull()
      .references(() => unitsOfMeasure.id, { onDelete: "restrict" }),
    factor: numeric("factor", { precision: 14, scale: 6 }).notNull(), // units of baseUom per 1 of this uom
  },
  (table) => [uniqueIndex("product_uom_conversions_unique_idx").on(table.productId, table.uomId)],
);

export const productsRelations = relations(products, ({ many, one }) => ({
  variants: many(productVariants),
  baseUom: one(unitsOfMeasure, { fields: [products.baseUomId], references: [unitsOfMeasure.id] }),
  uomConversions: many(productUomConversions),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const productUomConversionsRelations = relations(productUomConversions, ({ one }) => ({
  product: one(products, { fields: [productUomConversions.productId], references: [products.id] }),
  uom: one(unitsOfMeasure, {
    fields: [productUomConversions.uomId],
    references: [unitsOfMeasure.id],
  }),
}));
