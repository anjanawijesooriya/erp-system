import { boolean, integer, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

const partyColumns = {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  code: text("code"), // optional, tenant-assigned short code
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  taxId: text("tax_id"),
  creditLimit: numeric("credit_limit", { precision: 14, scale: 4 }).notNull().default("0"),
  creditTermDays: integer("credit_term_days").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const customers = pgTable(
  "customers",
  { ...partyColumns },
  (table) => [uniqueIndex("customers_tenant_code_idx").on(table.tenantId, table.code)],
);

export const suppliers = pgTable(
  "suppliers",
  { ...partyColumns },
  (table) => [uniqueIndex("suppliers_tenant_code_idx").on(table.tenantId, table.code)],
);
