import { numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

/**
 * The three tiers from the build plan's "Plans and feature flags" section:
 * POS (sales, basic stock, daily reports), Business (+ purchasing, credit
 * customers/suppliers, multi-branch), ERP (+ full accounting, cheques/PDC,
 * payroll, advanced reports). Module access and limits per tier live in
 * packages/core/src/plans/plan-tiers.ts, not here — this column is just
 * which tier a tenant is on.
 */
export const planTierEnum = pgEnum("plan_tier", ["pos", "business", "erp"]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" })
    .unique(),
  plan: planTierEnum("plan").notNull().default("pos"),
  status: text("status").notNull().default("trialing"), // trialing | active | past_due | canceled
  payhereRecurringToken: text("payhere_recurring_token"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  currency: text("currency").notNull().default("LKR"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
