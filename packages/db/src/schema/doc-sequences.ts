import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { branches, tenants } from "./tenants";

/**
 * Build-plan rule #5: document numbers are gapless per tenant, branch and
 * type (e.g. INV-COL-000123). `lastNumber` must only ever be incremented
 * inside a transaction that locks the row (SELECT ... FOR UPDATE) — see
 * packages/core/src/doc-numbers.ts — never generated from a count(*) query.
 */
export const docNumberSequences = pgTable(
  "doc_number_sequences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    docType: text("doc_type").notNull(), // e.g. "sales_invoice", "grn", "payment"
    prefix: text("prefix").notNull(), // e.g. "INV"
    lastNumber: integer("last_number").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("doc_number_sequences_unique_idx").on(table.tenantId, table.branchId, table.docType),
  ],
);
