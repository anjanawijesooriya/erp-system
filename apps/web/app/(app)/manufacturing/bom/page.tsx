import { listBoms } from "@erp/core/manufacturing";
import { listProducts } from "@erp/core/catalog";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { BomForm } from "./bom-form";
import { DeactivateBomButton } from "./deactivate-button";

export default async function BomPage() {
  const { tenantId, userId } = await requireSession();
  const [boms, products, canManage] = await Promise.all([
    listBoms(tenantId),
    listProducts(tenantId),
    can(userId, PERMISSIONS.BOM_MANAGE),
  ]);

  const variantOptions = products.flatMap((p) =>
    p.variants.map((v) => ({ id: v.id, label: `${v.sku} — ${p.name}${v.name !== "Default" ? ` (${v.name})` : ""}` })),
  );

  return (
    <ModuleGate tenantId={tenantId} moduleKey="manufacturing">
      <main className="mx-auto max-w-4xl p-8">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Bills of materials</h1>

        {canManage && (
          <div className="mb-6">
            <BomForm variants={variantOptions} />
          </div>
        )}

        <div className="space-y-4">
          {boms.map((bom) => (
            <div key={bom.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2">
                <div className="text-sm font-medium">
                  {bom.name} → {bom.outputQuantity} × {bom.outputVariant.sku}
                </div>
                {canManage && <DeactivateBomButton bomId={bom.id} />}
              </div>
              <ul className="px-4 py-2 text-sm">
                {bom.lines.map((l) => (
                  <li key={l.id} className="text-slate-600">
                    {l.quantity} × {l.componentVariant.sku} — {l.componentVariant.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {boms.length === 0 && <p className="text-sm text-slate-400">No BOMs yet.</p>}
        </div>
      </main>
    </ModuleGate>
  );
}
