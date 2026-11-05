import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Platform operators (not tenant users) — the build plan's "super-admin
 * panel: tenants, plans, usage, support impersonation with audit log".
 * Deliberately NOT a row in `users`, which always requires a `tenantId`;
 * a platform admin isn't scoped to any one tenant. Authenticated via a
 * separate signed-cookie session, not NextAuth — see
 * apps/web/lib/admin-session.ts.
 */
export const platformAdmins = pgTable("platform_admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
