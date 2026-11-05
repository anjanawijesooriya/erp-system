import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { OpeningBalanceForm } from "./opening-balance-form";
import {
  importOpeningCustomersAction,
  importOpeningStockAction,
  importOpeningSuppliersAction,
} from "./actions";

export default async function OpeningBalancesPage() {
  const { tenantId, userId } = await requireSession();
  const [branches, canImport] = await Promise.all([
    getBranchOptions(tenantId),
    can(userId, PERMISSIONS.OPENING_BALANCE_IMPORT),
  ]);

  if (!canImport) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="text-sm text-slate-500">You don&apos;t have permission to import opening balances.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-1 text-xl font-semibold">Opening balances (go-live import)</h1>
      <p className="mb-6 text-sm text-slate-500">
        For bringing a pilot shop&apos;s existing stock, receivables and payables into the system
        when it goes live. Each import posts real, agable invoices and stock movements — a correct,
        audited part of the ledger, not a shortcut around it. The GL offset lands in &quot;Opening
        Balance Equity&quot; (3800), never Sales Revenue or COGS.
      </p>

      <div className="space-y-6">
        <OpeningBalanceForm
          action={importOpeningStockAction}
          branches={branches}
          title="Opening stock"
          columnsHint="warehouseCode, sku, quantity, unitCost, batchNumber (optional), expiryDate (optional)"
        />
        <OpeningBalanceForm
          action={importOpeningCustomersAction}
          branches={branches}
          title="Opening customer balances (receivables)"
          columnsHint="customerCode or customerName, amount"
        />
        <OpeningBalanceForm
          action={importOpeningSuppliersAction}
          branches={branches}
          title="Opening supplier balances (payables)"
          columnsHint="supplierCode or supplierName, amount"
        />
      </div>
    </main>
  );
}
