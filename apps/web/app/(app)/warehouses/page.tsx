import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { branches } from "@erp/db/schema";
import { listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader, Card, EmptyState } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { BuildingIcon } from "@/components/icons";
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
      <PageHeader title="Warehouses" description="Physical locations stock is held at." icon={<BuildingIcon className="h-5 w-5" />} />

      {canManage && (
        <div className="mb-6">
          <WarehouseForm branches={tenantBranches} />
        </div>
      )}

      {warehouses.length === 0 ? (
        <Card>
          <EmptyState icon={<BuildingIcon className="h-5 w-5" />} title="No warehouses yet." description="Add one above." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Branch</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 text-slate-500">{w.code}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{w.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{w.branch?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
    </ModuleGate>
  );
}
