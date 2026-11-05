import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import {
  branches,
  customers,
  ledgerAccounts,
  products,
  salesInvoices,
  stockBalances,
  suppliers,
  supplierInvoices,
  tenants,
  users,
  warehouses,
} from "@erp/db/schema";

/**
 * A reasonably complete snapshot for GDPR-style "export my data" /
 * take-your-data-and-leave requests — not a full relational dump (no line
 * items, movements or journal lines), but enough to reconstruct a
 * tenant's master data and headline transaction history outside the
 * platform. `passwordHash` is deliberately excluded from the users export.
 */
export async function exportTenantData(tenantId: string) {
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
  if (!tenant) throw new Error("Tenant not found");

  const [
    branchRows,
    userRows,
    customerRows,
    supplierRows,
    productRows,
    warehouseRows,
    stockRows,
    accountRows,
    salesInvoiceRows,
    supplierInvoiceRows,
  ] = await Promise.all([
    db.select().from(branches).where(eq(branches.tenantId, tenantId)),
    db
      .select({ id: users.id, name: users.name, email: users.email, isActive: users.isActive })
      .from(users)
      .where(eq(users.tenantId, tenantId)),
    db.select().from(customers).where(eq(customers.tenantId, tenantId)),
    db.select().from(suppliers).where(eq(suppliers.tenantId, tenantId)),
    db.query.products.findMany({ where: eq(products.tenantId, tenantId), with: { variants: true } }),
    db.select().from(warehouses).where(eq(warehouses.tenantId, tenantId)),
    db.select().from(stockBalances).where(eq(stockBalances.tenantId, tenantId)),
    db.select().from(ledgerAccounts).where(eq(ledgerAccounts.tenantId, tenantId)),
    db.query.salesInvoices.findMany({ where: eq(salesInvoices.tenantId, tenantId), with: { lines: true } }),
    db.query.supplierInvoices.findMany({
      where: eq(supplierInvoices.tenantId, tenantId),
      with: { lines: true },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, businessType: tenant.businessType },
    branches: branchRows,
    users: userRows,
    customers: customerRows,
    suppliers: supplierRows,
    products: productRows,
    warehouses: warehouseRows,
    stockBalances: stockRows,
    ledgerAccounts: accountRows,
    salesInvoices: salesInvoiceRows,
    supplierInvoices: supplierInvoiceRows,
  };
}
