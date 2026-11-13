import { can, listRoles, PERMISSIONS } from "@erp/core/rbac";
import { listTenantUsers } from "@erp/core/tenants";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { UsersIcon } from "@/components/icons";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const { tenantId, userId } = await requireSession();
  const [users, roles, branches, canManage] = await Promise.all([
    listTenantUsers(tenantId),
    listRoles(tenantId),
    getBranchOptions(tenantId),
    can(userId, PERMISSIONS.USER_MANAGE),
  ]);

  const branchCount = new Set(
    users.flatMap((u) => u.roles.map((r) => r.branch?.id).filter(Boolean)),
  ).size;

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    roleNames: Array.from(new Set(u.roles.map((r) => r.role?.name).filter((n): n is string => !!n))),
    branchNames: Array.from(new Set(u.roles.map((r) => r.branch?.name).filter((n): n is string => !!n))),
  }));

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader
        title="Staff & users"
        description={`${rows.length} staff${branchCount > 0 ? ` across ${branchCount} branch${branchCount === 1 ? "" : "es"}` : ""}`}
        icon={<UsersIcon className="h-5 w-5" />}
      />

      <UsersClient users={rows} roles={roles} branches={branches} canManage={canManage} />
    </main>
  );
}
