import { relations } from "drizzle-orm";
import { boolean, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { branches, tenants } from "./tenants";
import { productVariants } from "./catalog";
import { warehouses } from "./inventory";
import { users } from "./users";

// --- Phase 9: Manufacturing / BOM -------------------------------------------------------

/**
 * A recipe: `outputVariant`, made in batches of `outputQuantity` (base UoM),
 * each batch consuming the listed `billOfMaterialLines` component
 * quantities. Versioned by simply creating a new BOM row for the same
 * output variant and marking the old one inactive via `isActive` — never
 * edited in place once a production order has used it (same
 * never-edit-posted-records principle as the rest of the ledger).
 */
export const billOfMaterials = pgTable("bill_of_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  outputVariantId: uuid("output_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  outputQuantity: numeric("output_quantity", { precision: 14, scale: 4 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const billOfMaterialLines = pgTable("bill_of_material_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  bomId: uuid("bom_id")
    .notNull()
    .references(() => billOfMaterials.id, { onDelete: "cascade" }),
  componentVariantId: uuid("component_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull(), // per one `outputQuantity` batch, base UoM
});

export const productionOrderStatusEnum = pgEnum("production_order_status", [
  "draft",
  "completed",
  "cancelled",
]);

/**
 * Consumes components and produces output purely as stock movements
 * (`postMovement` with `movementType: "production_consumption" /
 * "production_output"`) — no GL entry, since inventory value just moves
 * from the component variants to the output variant, total value
 * conserved. See packages/core/src/manufacturing/production.ts.
 */
export const productionOrders = pgTable("production_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id, { onDelete: "restrict" }),
  bomId: uuid("bom_id")
    .notNull()
    .references(() => billOfMaterials.id, { onDelete: "restrict" }),
  plannedBatches: numeric("planned_batches", { precision: 14, scale: 4 }).notNull(),
  actualOutputQuantity: numeric("actual_output_quantity", { precision: 14, scale: 4 }),
  status: productionOrderStatusEnum("status").notNull().default("draft"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const billOfMaterialsRelations = relations(billOfMaterials, ({ one, many }) => ({
  outputVariant: one(productVariants, { fields: [billOfMaterials.outputVariantId], references: [productVariants.id] }),
  lines: many(billOfMaterialLines),
}));

export const billOfMaterialLinesRelations = relations(billOfMaterialLines, ({ one }) => ({
  bom: one(billOfMaterials, { fields: [billOfMaterialLines.bomId], references: [billOfMaterials.id] }),
  componentVariant: one(productVariants, {
    fields: [billOfMaterialLines.componentVariantId],
    references: [productVariants.id],
  }),
}));

export const productionOrdersRelations = relations(productionOrders, ({ one }) => ({
  branch: one(branches, { fields: [productionOrders.branchId], references: [branches.id] }),
  warehouse: one(warehouses, { fields: [productionOrders.warehouseId], references: [warehouses.id] }),
  bom: one(billOfMaterials, { fields: [productionOrders.bomId], references: [billOfMaterials.id] }),
}));
