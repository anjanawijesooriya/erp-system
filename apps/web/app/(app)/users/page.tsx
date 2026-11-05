import { can, listRoles, PERMISSIONS } from "@erp/core/rbac";
import { listTenantUsers } from "@erp/core/tenants";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { InviteUserForm } from "./invite-form";
import { DeactivateButton } from "./deactivate-button";

export default async function UsersPage() {
  const { tenantId, userId } = await requireSession();
  const [users, roles, branches, canManage] = await Promise.all([
    listTenantUsers(tenantId),
    listRoles(tenantId),
    getBranchOptions(tenantId),
    can(userId, PERMISSIONS.USER_MANAGE),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Users</h1>

      {canManage && roles.length > 0 && (
        <div className="mb-6">
          <InviteUserForm roles={roles} branches={branches} />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Roles</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">
                  {u.roles
                    .map((r) => `${r.role?.name ?? "?"}${r.branch ? ` (${r.branch.name})` : ""}`)
                    .join(", ") || "—"}
                </td>
                <td className="px-4 py-2">{u.isActive ? "Active" : "Inactive"}</td>
                <td className="px-4 py-2">
                  {canManage && u.isActive && <DeactivateButton userId={u.id} />}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
