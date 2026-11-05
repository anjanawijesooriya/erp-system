import { relations } from "drizzle-orm";
import { boolean, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tenants, branches } from "./tenants";
import { users } from "./users";

/**
 * A role groups permissions, e.g. "Cashier", "Accountant", "Branch Manager".
 * System roles (isSystem = true) ship with the platform and apply to every
 * tenant; tenants may also define their own custom roles.
 */
export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // null = system role
    name: text("name").notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("roles_tenant_name_idx").on(table.tenantId, table.name)],
);

/**
 * A permission is a single granular action, e.g. "sales.invoice.create",
 * "inventory.cost_price.view", "accounting.journal.post". Business rule #1
 * from the build plan: only the accountant role gets accounting.journal.post.
 */
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(), // dot-namespaced, e.g. "inventory.cost_price.view"
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

/**
 * Assigns a role to a user. `branchId` null means the role applies to all
 * branches in the tenant; set it to scope a role to one branch (e.g. a
 * cashier who only works the Colombo branch).
 */
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    // null = role applies to every branch in the tenant
    branchId: uuid("branch_id").references(() => branches.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("user_roles_unique_idx").on(table.userId, table.roleId, table.branchId),
  ],
);

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const usersRolesRelations = relations(users, ({ many }) => ({
  roles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
  branch: one(branches, { fields: [userRoles.branchId], references: [branches.id] }),
}));
