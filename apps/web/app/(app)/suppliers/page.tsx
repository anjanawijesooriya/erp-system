import { listSuppliersWithStats } from "@erp/core/parties";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ImportForm } from "@/components/import-form";
import { PartyForm } from "@/components/party-form";
import { PartyStatsList } from "@/components/party-stats-list";
import { TruckIcon } from "@/components/icons";
import { createSupplierAction, importSuppliersAction } from "./actions";

export default async function SuppliersPage() {
  const { tenantId, userId } = await requireSession();
  const [suppliers, canManage] = await Promise.all([
    listSuppliersWithStats(tenantId),
    can(userId, PERMISSIONS.SUPPLIER_MANAGE),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader
        title="Suppliers"
        description="Vendors you purchase stock and services from."
        icon={<TruckIcon className="h-5 w-5" />}
      />

      {canManage && (
        <div className="mb-6 space-y-4">
          <PartyForm
            action={createSupplierAction}
            submitLabel="Add supplier"
            title="New supplier"
            icon={<TruckIcon className="h-4 w-4" />}
          />
          <ImportForm
            action={importSuppliersAction}
            columnsHint="code, name, phone, email, address, taxId, creditLimit, creditTermDays"
          />
        </div>
      )}

      <PartyStatsList
        parties={suppliers.map((s) => ({ ...s, totalValue: s.totalPurchases }))}
        totalLabel="suppliers"
        totalValueLabel="Total purchases"
        emptyLabel="No suppliers match these filters."
        basePath="/suppliers"
      />
    </main>
  );
}
