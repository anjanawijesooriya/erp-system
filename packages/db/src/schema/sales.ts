import { relations } from "drizzle-orm";
import { date, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { branches, tenants } from "./tenants";
import { customers } from "./parties";
import { productVariants } from "./catalog";
import { warehouses } from "./inventory";
import { users } from "./users";
import { paymentMethodEnum } from "./shared";

// --- Quotations -------------------------------------------------------

export const quotationStatusEnum = pgEnum("quotation_status", ["open", "closed", "cancelled"]);

export const quotations = pgTable("quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  docNumber: text("doc_number").notNull(),
  status: quotationStatusEnum("status").notNull().default("open"),
  quoteDate: date("quote_date").notNull(),
  validUntil: date("valid_until"),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quotationLines = pgTable("quotation_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id")
    .notNull()
    .references(() => quotations.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  qty: numeric("qty", { precision: 14, scale: 4 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 4 }).notNull(),
});

// --- Sales orders -------------------------------------------------------

export const salesOrderStatusEnum = pgEnum("sales_order_status", ["open", "closed", "cancelled"]);

export const salesOrders = pgTable("sales_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  quotationId: uuid("quotation_id").references(() => quotations.id, { onDelete: "set null" }),
  docNumber: text("doc_number").notNull(),
  status: salesOrderStatusEnum("status").notNull().default("open"),
  orderDate: date("order_date").notNull(),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salesOrderLines = pgTable("sales_order_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  salesOrderId: uuid("sales_order_id")
    .notNull()
    .references(() => salesOrders.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  qty: numeric("qty", { precision: 14, scale: 4 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 4 }).notNull(),
});

// --- Sales invoices -------------------------------------------------------

export const salesInvoiceStatusEnum = pgEnum("sales_invoice_status", [
  "unpaid",
  "partially_paid",
  "paid",
  "cancelled",
]);

/**
 * Billing only — like a supplier invoice in Phase 4, creating a sales
 * invoice does not move stock. The stock-moving event is a delivery (see
 * below), which may reference an invoice or go out standalone. A POS sale
 * (packages/core/src/sales/pos.ts) creates an invoice + delivery + payment
 * together in one transaction, immediately paid.
 */
export const salesInvoices = pgTable("sales_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  salesOrderId: uuid("sales_order_id").references(() => salesOrders.id, { onDelete: "set null" }),
  docNumber: text("doc_number").notNull(),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  totalAmount: numeric("total_amount", { precision: 14, scale: 4 }).notNull(),
  status: salesInvoiceStatusEnum("status").notNull().default("unpaid"),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salesInvoiceLines = pgTable("sales_invoice_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => salesInvoices.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  qty: numeric("qty", { precision: 14, scale: 4 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 4 }).notNull(),
  lineTotal: numeric("line_total", { precision: 14, scale: 4 }).notNull(),
});

// --- Deliveries -------------------------------------------------------

/** Posts immediately (no draft state), like a GRN — each line writes a
 * "sales" stock movement out of the warehouse at the current weighted-
 * average cost. */
export const deliveries = pgTable("deliveries", {
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
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  invoiceId: uuid("invoice_id").references(() => salesInvoices.id, { onDelete: "set null" }),
  docNumber: text("doc_number").notNull(),
  deliveryDate: date("delivery_date").notNull(),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deliveryLines = pgTable("delivery_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  deliveryId: uuid("delivery_id")
    .notNull()
    .references(() => deliveries.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  qty: numeric("qty", { precision: 14, scale: 4 }).notNull(),
  batchNumber: text("batch_number"),
});

// --- Sales payments -------------------------------------------------------

export const salesPayments = pgTable("sales_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
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

export const salesPaymentAllocations = pgTable("sales_payment_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => salesPayments.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => salesInvoices.id, { onDelete: "restrict" }),
  amountApplied: numeric("amount_applied", { precision: 14, scale: 4 }).notNull(),
});

// --- Sales returns / credit notes -------------------------------------------------------

export const salesReturnReasonEnum = pgEnum("sales_return_reason", [
  "damaged",
  "wrong_item",
  "customer_changed_mind",
  "other",
]);

export const salesReturns = pgTable("sales_returns", {
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
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  invoiceId: uuid("invoice_id").references(() => salesInvoices.id, { onDelete: "set null" }),
  docNumber: text("doc_number").notNull(),
  returnDate: date("return_date").notNull(),
  reason: salesReturnReasonEnum("reason").notNull(),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salesReturnLines = pgTable("sales_return_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  returnId: uuid("return_id")
    .notNull()
    .references(() => salesReturns.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  qty: numeric("qty", { precision: 14, scale: 4 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 4 }).notNull(), // credit value per unit
});

// --- Relations -------------------------------------------------------

export const quotationsRelations = relations(quotations, ({ many, one }) => ({
  lines: many(quotationLines),
  customer: one(customers, { fields: [quotations.customerId], references: [customers.id] }),
}));

export const quotationLinesRelations = relations(quotationLines, ({ one }) => ({
  quotation: one(quotations, { fields: [quotationLines.quotationId], references: [quotations.id] }),
  productVariant: one(productVariants, {
    fields: [quotationLines.productVariantId],
    references: [productVariants.id],
  }),
}));

export const salesOrdersRelations = relations(salesOrders, ({ many, one }) => ({
  lines: many(salesOrderLines),
  customer: one(customers, { fields: [salesOrders.customerId], references: [customers.id] }),
}));

export const salesOrderLinesRelations = relations(salesOrderLines, ({ one }) => ({
  salesOrder: one(salesOrders, { fields: [salesOrderLines.salesOrderId], references: [salesOrders.id] }),
  productVariant: one(productVariants, {
    fields: [salesOrderLines.productVariantId],
    references: [productVariants.id],
  }),
}));

export const salesInvoicesRelations = relations(salesInvoices, ({ many, one }) => ({
  lines: many(salesInvoiceLines),
  allocations: many(salesPaymentAllocations),
  customer: one(customers, { fields: [salesInvoices.customerId], references: [customers.id] }),
}));

export const salesInvoiceLinesRelations = relations(salesInvoiceLines, ({ one }) => ({
  invoice: one(salesInvoices, { fields: [salesInvoiceLines.invoiceId], references: [salesInvoices.id] }),
  productVariant: one(productVariants, {
    fields: [salesInvoiceLines.productVariantId],
    references: [productVariants.id],
  }),
}));

export const deliveriesRelations = relations(deliveries, ({ many, one }) => ({
  lines: many(deliveryLines),
  customer: one(customers, { fields: [deliveries.customerId], references: [customers.id] }),
  warehouse: one(warehouses, { fields: [deliveries.warehouseId], references: [warehouses.id] }),
  invoice: one(salesInvoices, { fields: [deliveries.invoiceId], references: [salesInvoices.id] }),
}));

export const deliveryLinesRelations = relations(deliveryLines, ({ one }) => ({
  delivery: one(deliveries, { fields: [deliveryLines.deliveryId], references: [deliveries.id] }),
  productVariant: one(productVariants, {
    fields: [deliveryLines.productVariantId],
    references: [productVariants.id],
  }),
}));

export const salesPaymentsRelations = relations(salesPayments, ({ many, one }) => ({
  allocations: many(salesPaymentAllocations),
  customer: one(customers, { fields: [salesPayments.customerId], references: [customers.id] }),
}));

export const salesPaymentAllocationsRelations = relations(salesPaymentAllocations, ({ one }) => ({
  payment: one(salesPayments, {
    fields: [salesPaymentAllocations.paymentId],
    references: [salesPayments.id],
  }),
  invoice: one(salesInvoices, {
    fields: [salesPaymentAllocations.invoiceId],
    references: [salesInvoices.id],
  }),
}));

export const salesReturnsRelations = relations(salesReturns, ({ many, one }) => ({
  lines: many(salesReturnLines),
  customer: one(customers, { fields: [salesReturns.customerId], references: [customers.id] }),
  warehouse: one(warehouses, { fields: [salesReturns.warehouseId], references: [warehouses.id] }),
}));

export const salesReturnLinesRelations = relations(salesReturnLines, ({ one }) => ({
  salesReturn: one(salesReturns, { fields: [salesReturnLines.returnId], references: [salesReturns.id] }),
  productVariant: one(productVariants, {
    fields: [salesReturnLines.productVariantId],
    references: [productVariants.id],
  }),
}));
