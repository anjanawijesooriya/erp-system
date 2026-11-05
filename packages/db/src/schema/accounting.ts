import { relations } from "drizzle-orm";
import { boolean, date, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { branches, tenants } from "./tenants";
import { ledgerAccounts } from "./accounts";
import { users } from "./users";
import { customers, suppliers } from "./parties";

// --- Journal entries -------------------------------------------------------

/**
 * The double-entry ledger (build-plan rule #1). Every journal entry's
 * lines must sum debit = credit — enforced in
 * packages/core/src/accounting/journal.ts's postJournalEntry, the single
 * writer, not by a DB constraint (Postgres can't easily CHECK an
 * aggregate across sibling rows). Entries are never edited or deleted
 * (rule #3); a correction is a new entry referencing this one via
 * `reversalOfEntryId`.
 */
export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  docNumber: text("doc_number").notNull(),
  entryDate: date("entry_date").notNull(),
  // e.g. "grn", "supplier_invoice", "supplier_payment", "purchase_return",
  // "sales_invoice", "delivery", "sales_payment", "sales_return", "manual"
  referenceType: text("reference_type").notNull(),
  referenceId: uuid("reference_id"),
  memo: text("memo"),
  reversalOfEntryId: uuid("reversal_of_entry_id"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const journalEntryLines = pgTable("journal_entry_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  journalEntryId: uuid("journal_entry_id")
    .notNull()
    .references(() => journalEntries.id, { onDelete: "cascade" }),
  accountId: uuid("account_id")
    .notNull()
    .references(() => ledgerAccounts.id, { onDelete: "restrict" }),
  debit: numeric("debit", { precision: 14, scale: 4 }).notNull().default("0"),
  credit: numeric("credit", { precision: 14, scale: 4 }).notNull().default("0"),
  description: text("description"),
});

// --- Accounting periods -------------------------------------------------------

export const accountingPeriods = pgTable("accounting_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  isClosed: boolean("is_closed").notNull().default(false),
  closedByUserId: uuid("closed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Cheques (PDC tracking) -------------------------------------------------------

export const chequeDirectionEnum = pgEnum("cheque_direction", ["received", "issued"]);
export const chequeStatusEnum = pgEnum("cheque_status", [
  "pending",
  "deposited",
  "cleared",
  "bounced",
  "cancelled",
]);

/**
 * A post-dated cheque. `received` (from a customer, via a sales payment)
 * sits in Post-Dated Cheques Receivable until deposited/cleared; `issued`
 * (to a supplier, via a supplier payment) sits in Post-Dated Cheques
 * Payable until it clears the bank. Status changes post their own journal
 * entries — see packages/core/src/accounting/cheques.ts.
 */
export const cheques = pgTable("cheques", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  direction: chequeDirectionEnum("direction").notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "restrict" }),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "restrict" }),
  chequeNumber: text("cheque_number").notNull(),
  bankName: text("bank_name"),
  chequeDate: date("cheque_date").notNull(), // the date written on the cheque
  amount: numeric("amount", { precision: 14, scale: 4 }).notNull(),
  status: chequeStatusEnum("status").notNull().default("pending"),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Bank reconciliation -------------------------------------------------------

export const bankReconciliations = pgTable("bank_reconciliations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  bankAccountId: uuid("bank_account_id")
    .notNull()
    .references(() => ledgerAccounts.id, { onDelete: "restrict" }),
  statementDate: date("statement_date").notNull(),
  statementBalance: numeric("statement_balance", { precision: 14, scale: 4 }).notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Marks individual bank-account journal entry lines as matched to a bank statement. */
export const bankReconciliationItems = pgTable("bank_reconciliation_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  reconciliationId: uuid("reconciliation_id")
    .notNull()
    .references(() => bankReconciliations.id, { onDelete: "cascade" }),
  journalEntryLineId: uuid("journal_entry_line_id")
    .notNull()
    .references(() => journalEntryLines.id, { onDelete: "cascade" }),
});

// --- Relations -------------------------------------------------------

export const journalEntriesRelations = relations(journalEntries, ({ many, one }) => ({
  lines: many(journalEntryLines),
  branch: one(branches, { fields: [journalEntries.branchId], references: [branches.id] }),
}));

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalEntryLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(ledgerAccounts, { fields: [journalEntryLines.accountId], references: [ledgerAccounts.id] }),
}));

export const chequesRelations = relations(cheques, ({ one }) => ({
  customer: one(customers, { fields: [cheques.customerId], references: [customers.id] }),
  supplier: one(suppliers, { fields: [cheques.supplierId], references: [suppliers.id] }),
}));

export const bankReconciliationsRelations = relations(bankReconciliations, ({ many, one }) => ({
  items: many(bankReconciliationItems),
  bankAccount: one(ledgerAccounts, {
    fields: [bankReconciliations.bankAccountId],
    references: [ledgerAccounts.id],
  }),
}));

export const bankReconciliationItemsRelations = relations(bankReconciliationItems, ({ one }) => ({
  reconciliation: one(bankReconciliations, {
    fields: [bankReconciliationItems.reconciliationId],
    references: [bankReconciliations.id],
  }),
  journalEntryLine: one(journalEntryLines, {
    fields: [bankReconciliationItems.journalEntryLineId],
    references: [journalEntryLines.id],
  }),
}));
