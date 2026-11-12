import { listCustomers } from "@erp/core/parties";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ImportForm } from "@/components/import-form";
import { PartyForm } from "@/components/party-form";
import { PartyTable } from "@/components/party-table";
import { UsersIcon } from "@/components/icons";
import { createCustomerAction, importCustomersAction } from "./actions";

export default async function CustomersPage() {
  const { tenantId, userId } = await requireSession();
  const [customers, canManage] = await Promise.all([
    listCustomers(tenantId),
    can(userId, PERMISSIONS.CUSTOMER_MANAGE),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader title="Customers" description="People and businesses you sell to." icon={<UsersIcon className="h-5 w-5" />} />

      {canManage && (
        <div className="mb-6 space-y-4">
          <PartyForm
            action={createCustomerAction}
            submitLabel="Add customer"
            title="New customer"
            icon={<UsersIcon className="h-4 w-4" />}
          />
          <ImportForm
            action={importCustomersAction}
            columnsHint="code, name, phone, email, address, taxId, creditLimit, creditTermDays"
          />
        </div>
      )}

      <PartyTable parties={customers} emptyLabel="No customers yet." />
    </main>
  );
}
