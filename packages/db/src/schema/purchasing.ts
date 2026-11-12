import { relations } from "drizzle-orm";
import { date, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { branches, tenants } from "./tenants";
import { suppliers } from "./parties";
import { productVariants } from "./catalog";
import { warehouses } from "./inventory";
import { users } from "./users";
import { paymentMethodEnum } from "./shared";

// --- Purchase orders -------------------------------------------------------

export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", ["open", "closed", "cancelled"]);

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "restrict" }),
  docNumber: text("doc_number").notNull(),
  status: purchaseOrderStatusEnum("status").notNull().default("open"),
  orderDate: date("order_date").notNull(),
  expectedDate: date("expected_date"),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const purchaseOrderLines = pgTable("purchase_order_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  orderedQty: numeric("ordered_qty", { precision: 14, scale: 4 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 14, scale: 4 }).notNull(),
});

// --- Goods receipt notes -------------------------------------------------------

/**
 * A GRN is posted immediately on creation (like transfers/adjustments in
 * Phase 3) — no draft state. Each line writes a "grn" stock movement with
 * the genuine purchase unit cost, which is what actually rolls the
 * warehouse's weighted-average cost forward for the first time (Phase 3's
 * transfers/adjustments only ever moved or corrected existing cost).
 * `purchaseOrderId` is optional: a GRN can be entered directly against a
 * supplier without a prior PO.
 */
export const goodsReceiptNotes = pgTable("goods_receipt_notes", {
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
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "restrict" }),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id, { onDelete: "set null" }),
  docNumber: text("doc_number").notNull(),
  receivedDate: date("received_date").notNull(),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const goodsReceiptNoteLines = pgTable("goods_receipt_note_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  grnId: uuid("grn_id")
    .notNull()
    .references(() => goodsReceiptNotes.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  receivedQty: numeric("received_qty", { precision: 14, scale: 4 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 14, scale: 4 }).notNull(),
  batchNumber: text("batch_number"),
  expiryDate: date("expiry_date"),
});

// --- Supplier invoices -------------------------------------------------------

export const supplierInvoiceStatusEnum = pgEnum("supplier_invoice_status", [
  "unpaid",
  "partially_paid",
  "paid",
  "cancelled",
]);

export const supplierInvoices = pgTable("supplier_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "restrict" }),
  grnId: uuid("grn_id").references(() => goodsReceiptNotes.id, { onDelete: "set null" }),
  docNumber: text("doc_number").notNull(),
  supplierRefNumber: text("supplier_ref_number"), // the supplier's own invoice number
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  totalAmount: numeric("total_amount", { precision: 14, scale: 4 }).notNull(),
  status: supplierInvoiceStatusEnum("status").notNull().default("unpaid"),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supplierInvoiceLines = pgTable("supplier_invoice_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => supplierInvoices.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  qty: numeric("qty", { precision: 14, scale: 4 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 14, scale: 4 }).notNull(),
  lineTotal: numeric("line_total", { precision: 14, scale: 4 }).notNull(),
});

// --- Supplier payments -------------------------------------------------------

export const supplierPayments = pgTable("supplier_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "restrict" }),
  docNumber: text("doc_number").notNull(),
  paymentDate: date("payment_date").notNull(),
  method: paymentMethodEnum("method").notNull(),
  amount: numeric("amount", { precision: 14, scale: 4 }).notNull(),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Splits a payment across one or more supplier invoices. */
export const supplierPaymentAllocations = pgTable("supplier_payment_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => supplierPayments.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => supplierInvoices.id, { onDelete: "restrict" }),
  amountApplied: numeric("amount_applied", { precision: 14, scale: 4 }).notNull(),
});

// --- Purchase returns -------------------------------------------------------

export const purchaseReturnReasonEnum = pgEnum("purchase_return_reason", [
  "damaged",
  "wrong_item",
  "excess",
  "other",
]);

export const purchaseReturns = pgTable("purchase_returns", {
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
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "restrict" }),
  grnId: uuid("grn_id").references(() => goodsReceiptNotes.id, { onDelete: "set null" }),
  docNumber: text("doc_number").notNull(),
  returnDate: date("return_date").notNull(),
  reason: purchaseReturnReasonEnum("reason").notNull(),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const purchaseReturnLines = pgTable("purchase_return_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  returnId: uuid("return_id")
    .notNull()
    .references(() => purchaseReturns.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  qty: numeric("qty", { precision: 14, scale: 4 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 14, scale: 4 }).notNull(),
});

// --- Relations -------------------------------------------------------

export const purchaseOrdersRelations = relations(purchaseOrders, ({ many, one }) => ({
  lines: many(purchaseOrderLines),
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  branch: one(branches, { fields: [purchaseOrders.branchId], references: [branches.id] }),
}));

export const purchaseOrderLinesRelations = relations(purchaseOrderLines, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderLines.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  productVariant: one(productVariants, {
    fields: [purchaseOrderLines.productVariantId],
    references: [productVariants.id],
  }),
}));

export const goodsReceiptNotesRelations = relations(goodsReceiptNotes, ({ many, one }) => ({
  lines: many(goodsReceiptNoteLines),
  supplier: one(suppliers, { fields: [goodsReceiptNotes.supplierId], references: [suppliers.id] }),
  warehouse: one(warehouses, { fields: [goodsReceiptNotes.warehouseId], references: [warehouses.id] }),
  purchaseOrder: one(purchaseOrders, {
    fields: [goodsReceiptNotes.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
}));

export const goodsReceiptNoteLinesRelations = relations(goodsReceiptNoteLines, ({ one }) => ({
  grn: one(goodsReceiptNotes, { fields: [goodsReceiptNoteLines.grnId], references: [goodsReceiptNotes.id] }),
  productVariant: one(productVariants, {
    fields: [goodsReceiptNoteLines.productVariantId],
    references: [productVariants.id],
  }),
}));

export const supplierInvoicesRelations = relations(supplierInvoices, ({ many, one }) => ({
  lines: many(supplierInvoiceLines),
  allocations: many(supplierPaymentAllocations),
  supplier: one(suppliers, { fields: [supplierInvoices.supplierId], references: [suppliers.id] }),
  grn: one(goodsReceiptNotes, { fields: [supplierInvoices.grnId], references: [goodsReceiptNotes.id] }),
}));

export const supplierInvoiceLinesRelations = relations(supplierInvoiceLines, ({ one }) => ({
  invoice: one(supplierInvoices, {
    fields: [supplierInvoiceLines.invoiceId],
    references: [supplierInvoices.id],
  }),
  productVariant: one(productVariants, {
    fields: [supplierInvoiceLines.productVariantId],
    references: [productVariants.id],
  }),
}));

export const supplierPaymentsRelations = relations(supplierPayments, ({ many, one }) => ({
  allocations: many(supplierPaymentAllocations),
  supplier: one(suppliers, { fields: [supplierPayments.supplierId], references: [suppliers.id] }),
}));

export const supplierPaymentAllocationsRelations = relations(supplierPaymentAllocations, ({ one }) => ({
  payment: one(supplierPayments, {
    fields: [supplierPaymentAllocations.paymentId],
    references: [supplierPayments.id],
  }),
  invoice: one(supplierInvoices, {
    fields: [supplierPaymentAllocations.invoiceId],
    references: [supplierInvoices.id],
  }),
}));

export const purchaseReturnsRelations = relations(purchaseReturns, ({ many, one }) => ({
  lines: many(purchaseReturnLines),
  supplier: one(suppliers, { fields: [purchaseReturns.supplierId], references: [suppliers.id] }),
  warehouse: one(warehouses, { fields: [purchaseReturns.warehouseId], references: [warehouses.id] }),
  grn: one(goodsReceiptNotes, { fields: [purchaseReturns.grnId], references: [goodsReceiptNotes.id] }),
}));

export const purchaseReturnLinesRelations = relations(purchaseReturnLines, ({ one }) => ({
  purchaseReturn: one(purchaseReturns, {
    fields: [purchaseReturnLines.returnId],
    references: [purchaseReturns.id],
  }),
  productVariant: one(productVariants, {
    fields: [purchaseReturnLines.productVariantId],
    references: [productVariants.id],
  }),
}));
