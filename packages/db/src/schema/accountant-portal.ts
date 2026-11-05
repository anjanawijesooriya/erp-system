import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

// --- Phase 9: Accountant portal (multi-company) -------------------------------------------------------

/**
 * An external accountant, not a row in any tenant's `users` — the same
 * reasoning as `platformAdmins`: they aren't scoped to one tenant, they
 * span several. Authenticated via its own signed-cookie session (see
 * apps/web/lib/accountant-session.ts), separate from NextAuth.
 */
export const accountants = pgTable("accountants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Which tenants this accountant may access, and whether they can post
 * journals/close periods there or only view reports — a tenant owner
 * grants this link, an accountant never self-grants access to a company.
 */
export const accountantTenantLinks = pgTable(
  "accountant_tenant_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountantId: uuid("accountant_id")
      .notNull()
      .references(() => accountants.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    canPostJournals: boolean("can_post_journals").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("accountant_tenant_links_idx").on(table.accountantId, table.tenantId)],
);

export const accountantsRelations = relations(accountants, ({ many }) => ({
  tenantLinks: many(accountantTenantLinks),
}));

export const accountantTenantLinksRelations = relations(accountantTenantLinks, ({ one }) => ({
  accountant: one(accountants, { fields: [accountantTenantLinks.accountantId], references: [accountants.id] }),
  tenant: one(tenants, { fields: [accountantTenantLinks.tenantId], references: [tenants.id] }),
}));
