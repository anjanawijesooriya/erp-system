import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { boolean, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const accountTypeEnum = pgEnum("account_type", [
  "asset",
  "liability",
  "equity",
  "income",
  "expense",
]);

/**
 * Chart of accounts. Named `ledgerAccounts` (table name "ledger_accounts")
 * to avoid colliding with the NextAuth adapter's unrelated `accounts`
 * table (OAuth provider links) in ./auth.ts. Seeded per tenant from a
 * business-type template (see
 * packages/core/src/accounting/chart-of-accounts-templates.ts) at tenant
 * onboarding — this table holds the tenant's own copy, which they can then
 * extend with their own accounts. `isSystemAccount` rows (Accounts
 * Receivable, Accounts Payable, Inventory, etc.) are the ones later phases'
 * automatic posting logic (build-plan rule #1) targets by a stable code,
 * so they shouldn't be deleted or have their code changed by tenant users.
 */
export const ledgerAccounts = pgTable(
  "ledger_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(), // e.g. "1000"
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull(),
    parentAccountId: uuid("parent_account_id").references((): AnyPgColumn => ledgerAccounts.id, {
      onDelete: "set null",
    }),
    isSystemAccount: boolean("is_system_account").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ledger_accounts_tenant_code_idx").on(table.tenantId, table.code)],
);
