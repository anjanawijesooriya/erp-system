import { relations } from "drizzle-orm";
import { numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { branches, tenants } from "./tenants";
import { users } from "./users";

// --- Cash register (till) sessions -------------------------------------------------------

export const cashRegisterStatusEnum = pgEnum("cash_register_status", ["open", "closed"]);

/**
 * One cash-drawer session per branch at a time (enforced in
 * packages/core/src/pos/cash-register.ts, not a DB constraint — a
 * partial unique index would be the stricter version of this, left as a
 * follow-up since the application-level check inside a transaction is
 * sufficient for a single-process checkout flow). The POS terminal
 * refuses to sell until a branch has an open session; closing one
 * records what was actually counted against what cash sales since
 * opening say *should* be in the drawer, surfacing the variance rather
 * than silently accepting whatever was counted.
 */
export const cashRegisterSessions = pgTable("cash_register_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  status: cashRegisterStatusEnum("status").notNull().default("open"),
  openingBalance: numeric("opening_balance", { precision: 14, scale: 2 }).notNull(),
  openingNote: text("opening_note"),
  openedByUserId: uuid("opened_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  // Cash sales recorded between openedAt and closedAt, added to
  // openingBalance — what the drawer should hold, snapshotted at close time.
  expectedClosingBalance: numeric("expected_closing_balance", { precision: 14, scale: 2 }),
  closingCountedBalance: numeric("closing_counted_balance", { precision: 14, scale: 2 }),
  // closingCountedBalance - expectedClosingBalance; positive = over, negative = short.
  variance: numeric("variance", { precision: 14, scale: 2 }),
  closingNote: text("closing_note"),
  closedByUserId: uuid("closed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const cashRegisterSessionsRelations = relations(cashRegisterSessions, ({ one }) => ({
  branch: one(branches, { fields: [cashRegisterSessions.branchId], references: [branches.id] }),
  openedBy: one(users, { fields: [cashRegisterSessions.openedByUserId], references: [users.id] }),
  closedBy: one(users, { fields: [cashRegisterSessions.closedByUserId], references: [users.id] }),
}));
