import { listSuppliers } from "@erp/core/parties";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ImportForm } from "@/components/import-form";
import { PartyForm } from "@/components/party-form";
import { PartyTable } from "@/components/party-table";
import { createSupplierAction, importSuppliersAction } from "./actions";

export default async function SuppliersPage() {
  const { tenantId, userId } = await requireSession();
  const [suppliers, canManage] = await Promise.all([
    listSuppliers(tenantId),
    can(userId, PERMISSIONS.SUPPLIER_MANAGE),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Suppliers</h1>

      {canManage && (
        <div className="mb-6 space-y-4">
          <PartyForm action={createSupplierAction} submitLabel="Add supplier" />
          <ImportForm
            action={importSuppliersAction}
            columnsHint="code, name, phone, email, address, taxId, creditLimit, creditTermDays"
          />
        </div>
      )}

      <PartyTable parties={suppliers} emptyLabel="No suppliers yet." />
    </main>
  );
}
