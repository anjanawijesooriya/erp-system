import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { branches } from "@erp/db/schema";
import { listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { WarehouseForm } from "./warehouse-form";

export default async function WarehousesPage() {
  const { tenantId, userId } = await requireSession();
  const [warehouses, tenantBranches, canManage] = await Promise.all([
    listWarehouses(tenantId),
    db.query.branches.findMany({ where: eq(branches.tenantId, tenantId) }),
    can(userId, PERMISSIONS.WAREHOUSE_MANAGE),
  ]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="inventory">
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Warehouses</h1>

      {canManage && (
        <div className="mb-6">
          <WarehouseForm branches={tenantBranches} />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Branch</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((w) => (
              <tr key={w.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{w.code}</td>
                <td className="px-4 py-2">{w.name}</td>
                <td className="px-4 py-2">{w.branch?.name ?? "—"}</td>
              </tr>
            ))}
            {warehouses.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No warehouses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
    </ModuleGate>
  );
}
