import { can, PERMISSIONS } from "@erp/core/rbac";
import { listWarehouses, listStockOnHand } from "@erp/core/inventory";
import { getOpenRegisterSession } from "@erp/core/pos";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { getPosVariantOptions } from "@/lib/pos-options";
import { PosTerminal } from "./pos-terminal";

export default async function PosPage() {
  const { tenantId, userId } = await requireSession();
  const [canSell, branches, warehouses, customers, variants, stock] = await Promise.all([
    can(userId, PERMISSIONS.POS_SELL),
    getBranchOptions(tenantId),
    listWarehouses(tenantId),
    getCustomerOptions(tenantId),
    getPosVariantOptions(tenantId),
    listStockOnHand(tenantId),
  ]);

  const branchId = branches[0]?.id;
  const openSession = branchId ? await getOpenRegisterSession(tenantId, branchId) : null;

  return (
    <main className="mx-auto max-w-7xl p-6 sm:p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Point of sale</h1>

      {!canSell && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          You don&apos;t have permission to sell at the POS.
        </p>
      )}
      {canSell && (branches.length === 0 || warehouses.length === 0 || variants.length === 0) && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add a branch, a warehouse and at least one product with a selling price before using the POS.
        </p>
      )}
      {canSell && branches.length > 0 && warehouses.length > 0 && variants.length > 0 && (
        <PosTerminal
          branches={branches}
          warehouses={warehouses}
          customers={customers}
          variants={variants}
          stock={stock.map((s) => ({ warehouseId: s.warehouseId, productVariantId: s.productVariantId, quantity: s.quantity }))}
          openSession={
            openSession
              ? { id: openSession.id, openingBalance: openSession.openingBalance, openedAt: openSession.openedAt.toISOString(), openedByName: openSession.openedBy?.name ?? "" }
              : null
          }
        />
      )}
    </main>
  );
}
