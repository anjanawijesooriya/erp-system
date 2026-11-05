import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * A tenant is one shop/company subscribing to the platform.
 * `shopId` (= tenants.id) is the scoping column on every tenant-owned table
 * and the basis for Postgres RLS policies — see migrations/0000_*_rls.sql.
 */
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  businessType: text("business_type"), // e.g. "hardware", "pharmacy", "grocery_wholesale"
  // Recipient for the daily owner SMS summary (Phase 7) — E.164, e.g. "+94771234567".
  ownerPhone: text("owner_phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(), // short code used in document numbers, e.g. "COL"
    address: text("address"),
    isHeadOffice: boolean("is_head_office").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("branches_tenant_code_idx").on(table.tenantId, table.code)],
);
