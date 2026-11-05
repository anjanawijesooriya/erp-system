import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

/**
 * Append-only audit trail. Build-plan rule #3: posted documents are never
 * deleted or edited in place — every create/update/void/reverse on a
 * tenant-owned table writes a row here with a before/after diff.
 */
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // e.g. "invoice.void", "journal.post", "user.role.assign"
  entityType: text("entity_type").notNull(), // e.g. "sales_invoice"
  entityId: uuid("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
