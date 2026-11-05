import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@erp/db";
import { permissions, rolePermissions, userRoles } from "@erp/db/schema";
import type { PermissionKey } from "./permissions";

/**
 * Returns true if the user holds a role (scoped to the given branch, or
 * tenant-wide) that grants `permission`. Always check this server-side —
 * never trust a client-sent role/permission claim.
 */
export async function can(
  userId: string,
  permission: PermissionKey,
  opts?: { branchId?: string },
): Promise<boolean> {
  const rows = await db
    .select({ key: permissions.key })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(permissions.key, permission),
        opts?.branchId
          ? or(isNull(userRoles.branchId), eq(userRoles.branchId, opts.branchId))
          : undefined,
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export class ForbiddenError extends Error {
  constructor(permission: string) {
    super(`Missing permission: ${permission}`);
    this.name = "ForbiddenError";
  }
}

/** Throws ForbiddenError if the user lacks the permission. Use in server actions/route handlers. */
export async function assertCan(
  userId: string,
  permission: PermissionKey,
  opts?: { branchId?: string },
): Promise<void> {
  if (!(await can(userId, permission, opts))) {
    throw new ForbiddenError(permission);
  }
}
