import { can, PERMISSIONS } from "@erp/core/rbac";
import { listWarehouses } from "@erp/core/inventory";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { getPosVariantOptions } from "@/lib/pos-options";
import { PosTerminal } from "./pos-terminal";

export default async function PosPage() {
  const { tenantId, userId } = await requireSession();
  const [canSell, branches, warehouses, customers, variants] = await Promise.all([
    can(userId, PERMISSIONS.POS_SELL),
    getBranchOptions(tenantId),
    listWarehouses(tenantId),
    getCustomerOptions(tenantId),
    getPosVariantOptions(tenantId),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Point of sale</h1>

      {!canSell && <p className="text-sm text-red-600">You don&apos;t have permission to sell at the POS.</p>}
      {canSell && (branches.length === 0 || warehouses.length === 0 || variants.length === 0) && (
        <p className="text-sm text-slate-500">
          Add a branch, a warehouse and at least one product with a selling price before using the POS.
        </p>
      )}
      {canSell && branches.length > 0 && warehouses.length > 0 && variants.length > 0 && (
        <PosTerminal branches={branches} warehouses={warehouses} customers={customers} variants={variants} />
      )}
    </main>
  );
}
