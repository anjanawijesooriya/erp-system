import { db } from "@erp/db";
import { permissions, roles, rolePermissions } from "@erp/db/schema";
import { ALL_PERMISSIONS } from "./permissions";
import { SYSTEM_ROLES } from "./system-roles";
import type { DbTx } from "../tenant-context";

/** Idempotent: inserts any permission keys missing from the global catalogue. Call once before seeding any tenant's roles. */
export async function seedGlobalPermissions(): Promise<void> {
  for (const key of ALL_PERMISSIONS) {
    await db.insert(permissions).values({ key }).onConflictDoNothing();
  }
}

/**
 * Creates (or re-syncs) the four system roles for a tenant and returns
 * their ids by name. Safe to call again after `PERMISSIONS` gains new
 * keys — it re-fetches an existing role rather than skipping it (see the
 * comment on the duplicate-role bug this fixed, in the demo seed script's
 * git history / build-progress memory).
 *
 * Pass `tx` to run inside a larger transaction (e.g. tenant onboarding);
 * omit it to run standalone against `db` directly.
 */
export async function seedSystemRolesForTenant(
  tenantId: string,
  tx?: DbTx,
): Promise<Record<string, string>> {
  const executor = tx ?? db;

  const allPermissionRows = await executor.select().from(permissions);
  const permissionIdByKey = new Map(allPermissionRows.map((p) => [p.key, p.id]));

  const roleIdByName: Record<string, string> = {};

  for (const [roleName, def] of Object.entries(SYSTEM_ROLES)) {
    const [inserted] = await executor
      .insert(roles)
      .values({ tenantId, name: roleName, description: def.description, isSystem: true })
      .onConflictDoNothing()
      .returning();

    const role =
      inserted ??
      (await executor.query.roles.findFirst({
        where: (r, { and: andOp, eq: eqOp }) => andOp(eqOp(r.tenantId, tenantId), eqOp(r.name, roleName)),
      }));
    if (!role) continue;

    roleIdByName[roleName] = role.id;

    for (const permKey of def.permissions) {
      const permissionId = permissionIdByKey.get(permKey);
      if (!permissionId) continue;
      await executor.insert(rolePermissions).values({ roleId: role.id, permissionId }).onConflictDoNothing();
    }
  }

  return roleIdByName;
}
