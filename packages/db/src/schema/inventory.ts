import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { branches, tenants } from "./tenants";
import { productVariants } from "./catalog";
import { users } from "./users";

export const warehouses = pgTable(
  "warehouses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("warehouses_tenant_code_idx").on(table.tenantId, table.code)],
);

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "grn",
  "sales",
  "sales_return",
  "purchase_return",
  "transfer_in",
  "transfer_out",
  "adjustment_in",
  "adjustment_out",
  "stock_count",
  "opening_balance",
]);

export const stockMovementDirectionEnum = pgEnum("stock_movement_direction", ["in", "out"]);

/**
 * The stock ledger (build-plan rule #2): there is no editable `quantity`
 * field anywhere — every GRN, sale, return, transfer and adjustment writes
 * an immutable row here, in the product's base unit of measure, and stock
 * on hand is the signed sum of these rows. Rows are never updated or
 * deleted (rule #3); a correction is a new, opposite movement.
 *
 * `stockBalances` below is a materialized running total kept in sync with
 * this table in the same transaction purely for read performance — it is
 * always re-derivable by replaying stockMovements and must never be
 * treated as a second source of truth.
 */
export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id, { onDelete: "restrict" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  movementType: stockMovementTypeEnum("movement_type").notNull(),
  direction: stockMovementDirectionEnum("direction").notNull(),
  quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull(), // always positive, base UoM
  // Unit cost in the base UoM at the time of this movement. Required for
  // "in" movements (feeds weighted-average costing); for "out" movements
  // it's the WAC snapshot at the moment of the movement, kept for reporting.
  unitCost: numeric("unit_cost", { precision: 14, scale: 4 }).notNull(),
  batchNumber: text("batch_number"),
  expiryDate: date("expiry_date"),
  referenceType: text("reference_type").notNull(), // e.g. "stock_transfer", "stock_adjustment"
  referenceId: uuid("reference_id"),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Materialized running balance per (warehouse, variant, batch) — see the
 * comment on stockMovements. `batchNumber` is the empty string (not null)
 * for non-batch-tracked products so the unique index still enforces one
 * row per (warehouse, variant) in that common case.
 */
export const stockBalances = pgTable(
  "stock_balances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    warehouseId: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    batchNumber: text("batch_number").notNull().default(""),
    quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull().default("0"),
    averageCost: numeric("average_cost", { precision: 14, scale: 4 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("stock_balances_unique_idx").on(
      table.warehouseId,
      table.productVariantId,
      table.batchNumber,
    ),
  ],
);

export const productReorderLevels = pgTable(
  "product_reorder_levels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    warehouseId: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    reorderLevel: numeric("reorder_level", { precision: 14, scale: 4 }).notNull().default("0"),
    reorderQty: numeric("reorder_qty", { precision: 14, scale: 4 }).notNull().default("0"),
  },
  (table) => [
    uniqueIndex("reorder_levels_unique_idx").on(table.warehouseId, table.productVariantId),
  ],
);

// --- Transfers -------------------------------------------------------

export const stockTransferStatusEnum = pgEnum("stock_transfer_status", ["draft", "completed", "cancelled"]);

export const stockTransfers = pgTable("stock_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  fromWarehouseId: uuid("from_warehouse_id")
    .notNull()
    .references(() => warehouses.id, { onDelete: "restrict" }),
  toWarehouseId: uuid("to_warehouse_id")
    .notNull()
    .references(() => warehouses.id, { onDelete: "restrict" }),
  status: stockTransferStatusEnum("status").notNull().default("draft"),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stockTransferLines = pgTable("stock_transfer_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  transferId: uuid("transfer_id")
    .notNull()
    .references(() => stockTransfers.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull(),
  batchNumber: text("batch_number"),
});

// --- Adjustments -------------------------------------------------------

export const stockAdjustmentReasonEnum = pgEnum("stock_adjustment_reason", [
  "damage",
  "theft_loss",
  "expiry",
  "correction",
  "other",
]);

export const stockAdjustments = pgTable("stock_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id, { onDelete: "restrict" }),
  reason: stockAdjustmentReasonEnum("reason").notNull(),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stockAdjustmentLines = pgTable("stock_adjustment_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  adjustmentId: uuid("adjustment_id")
    .notNull()
    .references(() => stockAdjustments.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  // Signed: positive increases stock, negative decreases it.
  quantityDelta: numeric("quantity_delta", { precision: 14, scale: 4 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 14, scale: 4 }).notNull(),
  batchNumber: text("batch_number"),
});

// --- Stock counts -------------------------------------------------------

export const stockCountStatusEnum = pgEnum("stock_count_status", ["open", "finalized", "cancelled"]);

export const stockCounts = pgTable("stock_counts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id, { onDelete: "restrict" }),
  status: stockCountStatusEnum("status").notNull().default("open"),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  finalizedAt: timestamp("finalized_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stockCountLines = pgTable("stock_count_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  stockCountId: uuid("stock_count_id")
    .notNull()
    .references(() => stockCounts.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  batchNumber: text("batch_number"),
  // Snapshot of stockBalances.quantity at the moment the count line was added.
  systemQuantity: numeric("system_quantity", { precision: 14, scale: 4 }).notNull(),
  countedQuantity: numeric("counted_quantity", { precision: 14, scale: 4 }).notNull(),
});

// --- Relations -------------------------------------------------------

export const warehousesRelations = relations(warehouses, ({ many, one }) => ({
  stockBalances: many(stockBalances),
  branch: one(branches, { fields: [warehouses.branchId], references: [branches.id] }),
}));

export const stockTransfersRelations = relations(stockTransfers, ({ many, one }) => ({
  lines: many(stockTransferLines),
  fromWarehouse: one(warehouses, {
    fields: [stockTransfers.fromWarehouseId],
    references: [warehouses.id],
  }),
  toWarehouse: one(warehouses, { fields: [stockTransfers.toWarehouseId], references: [warehouses.id] }),
}));

export const stockTransferLinesRelations = relations(stockTransferLines, ({ one }) => ({
  transfer: one(stockTransfers, {
    fields: [stockTransferLines.transferId],
    references: [stockTransfers.id],
  }),
  productVariant: one(productVariants, {
    fields: [stockTransferLines.productVariantId],
    references: [productVariants.id],
  }),
}));

export const stockAdjustmentsRelations = relations(stockAdjustments, ({ many, one }) => ({
  lines: many(stockAdjustmentLines),
  warehouse: one(warehouses, { fields: [stockAdjustments.warehouseId], references: [warehouses.id] }),
}));

export const stockAdjustmentLinesRelations = relations(stockAdjustmentLines, ({ one }) => ({
  adjustment: one(stockAdjustments, {
    fields: [stockAdjustmentLines.adjustmentId],
    references: [stockAdjustments.id],
  }),
  productVariant: one(productVariants, {
    fields: [stockAdjustmentLines.productVariantId],
    references: [productVariants.id],
  }),
}));

export const stockCountsRelations = relations(stockCounts, ({ many, one }) => ({
  lines: many(stockCountLines),
  warehouse: one(warehouses, { fields: [stockCounts.warehouseId], references: [warehouses.id] }),
}));

export const stockCountLinesRelations = relations(stockCountLines, ({ one }) => ({
  stockCount: one(stockCounts, {
    fields: [stockCountLines.stockCountId],
    references: [stockCounts.id],
  }),
  productVariant: one(productVariants, {
    fields: [stockCountLines.productVariantId],
    references: [productVariants.id],
  }),
}));

export const stockBalancesRelations = relations(stockBalances, ({ one }) => ({
  warehouse: one(warehouses, { fields: [stockBalances.warehouseId], references: [warehouses.id] }),
  productVariant: one(productVariants, {
    fields: [stockBalances.productVariantId],
    references: [productVariants.id],
  }),
}));
