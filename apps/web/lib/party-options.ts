import { listSuppliers } from "@erp/core/parties";
import { listCustomers } from "@erp/core/parties";

export async function getSupplierOptions(tenantId: string) {
  const suppliers = await listSuppliers(tenantId);
  return suppliers.map((s) => ({ id: s.id, label: s.name }));
}

export async function getCustomerOptions(tenantId: string) {
  const customers = await listCustomers(tenantId);
  return customers.map((c) => ({ id: c.id, label: c.name }));
}
