import { relations } from "drizzle-orm";
import { date, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { branches, tenants } from "./tenants";
import { users } from "./users";

// --- Weekly reconciliation (build-plan Phase 8: "reconcile weekly") -------------------------------------------------------

export const reconciliationMetricEnum = pgEnum("reconciliation_metric", ["sales", "cash", "stock_value"]);

/**
 * One row per (date, metric): the shop's manually-kept figure for that day,
 * entered by whoever is running the pilot. The matching "system" figure is
 * never stored — it's computed live from the normal report queries
 * (getSalesByDay, getStockValuation, the Cash in Hand trial-balance
 * balance) at the moment the reconciliation page is viewed, so it's always
 * current even if more documents get posted retroactively.
 */
export const pilotReconciliationEntries = pgTable("pilot_reconciliation_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  entryDate: date("entry_date").notNull(),
  metric: reconciliationMetricEnum("metric").notNull(),
  manualValue: numeric("manual_value", { precision: 14, scale: 4 }).notNull(),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Pilot issue tracker -------------------------------------------------------

export const issueSeverityEnum = pgEnum("issue_severity", ["low", "medium", "high", "critical"]);
export const issueStatusEnum = pgEnum("issue_status", ["open", "in_progress", "resolved", "closed"]);

export const pilotIssues = pgTable("pilot_issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").references(() => branches.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  severity: issueSeverityEnum("severity").notNull().default("medium"),
  status: issueStatusEnum("status").notNull().default("open"),
  reportedByUserId: uuid("reported_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const pilotReconciliationEntriesRelations = relations(pilotReconciliationEntries, ({ one }) => ({
  branch: one(branches, { fields: [pilotReconciliationEntries.branchId], references: [branches.id] }),
}));

export const pilotIssuesRelations = relations(pilotIssues, ({ one }) => ({
  branch: one(branches, { fields: [pilotIssues.branchId], references: [branches.id] }),
  reportedBy: one(users, { fields: [pilotIssues.reportedByUserId], references: [users.id] }),
  tenant: one(tenants, { fields: [pilotIssues.tenantId], references: [tenants.id] }),
}));
