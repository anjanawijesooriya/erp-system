import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { customers, productVariants, suppliers, warehouses } from "@erp/db/schema";
import { readWorksheetRows, type ImportResult } from "../import/excel";
import {
  postOpeningCustomerBalances,
  postOpeningStockBalances,
  postOpeningSupplierBalances,
} from "./opening-balances";

/** Expected columns: customerCode OR customerName, amount. Matches an existing customer by code first, then name. */
export async function importOpeningCustomerBalances(
  tenantId: string,
  userId: string,
  branchId: string,
  asOfDate: string,
  buffer: Buffer,
): Promise<ImportResult> {
  const rows = await readWorksheetRows(buffer);
  const result: ImportResult = { created: 0, errors: [] };
  const balances: { customerId: string; amount: number }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNumber = i + 2;
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      result.errors.push({ row: rowNumber, message: "amount must be a positive number" });
      continue;
    }

    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.tenantId, tenantId),
        row.customercode ? eq(customers.code, row.customercode) : eq(customers.name, row.customername ?? ""),
      ),
    });
    if (!customer) {
      result.errors.push({ row: rowNumber, message: `Customer not found: ${row.customercode || row.customername}` });
      continue;
    }

    balances.push({ customerId: customer.id, amount });
  }

  if (balances.length > 0) {
    const posted = await postOpeningCustomerBalances(tenantId, userId, branchId, asOfDate, balances);
    result.created = posted.count;
  }
  return result;
}

/** Expected columns: supplierCode OR supplierName, amount. */
export async function importOpeningSupplierBalances(
  tenantId: string,
  userId: string,
  branchId: string,
  asOfDate: string,
  buffer: Buffer,
): Promise<ImportResult> {
  const rows = await readWorksheetRows(buffer);
  const result: ImportResult = { created: 0, errors: [] };
  const balances: { supplierId: string; amount: number }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNumber = i + 2;
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      result.errors.push({ row: rowNumber, message: "amount must be a positive number" });
      continue;
    }

    const supplier = await db.query.suppliers.findFirst({
      where: and(
        eq(suppliers.tenantId, tenantId),
        row.suppliercode ? eq(suppliers.code, row.suppliercode) : eq(suppliers.name, row.suppliername ?? ""),
      ),
    });
    if (!supplier) {
      result.errors.push({ row: rowNumber, message: `Supplier not found: ${row.suppliercode || row.suppliername}` });
      continue;
    }

    balances.push({ supplierId: supplier.id, amount });
  }

  if (balances.length > 0) {
    const posted = await postOpeningSupplierBalances(tenantId, userId, branchId, asOfDate, balances);
    result.created = posted.count;
  }
  return result;
}

/** Expected columns: warehouseCode, sku, quantity, unitCost, batchNumber (optional), expiryDate (optional). */
export async function importOpeningStockBalances(
  tenantId: string,
  userId: string,
  branchId: string,
  asOfDate: string,
  buffer: Buffer,
): Promise<ImportResult> {
  const rows = await readWorksheetRows(buffer);
  const result: ImportResult = { created: 0, errors: [] };
  const balances: {
    warehouseId: string;
    productVariantId: string;
    quantity: number;
    unitCost: number;
    batchNumber?: string;
    expiryDate?: string;
  }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNumber = i + 2;
    const quantity = Number(row.quantity);
    const unitCost = Number(row.unitcost);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      result.errors.push({ row: rowNumber, message: "quantity must be a positive number" });
      continue;
    }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      result.errors.push({ row: rowNumber, message: "unitCost must be a non-negative number" });
      continue;
    }

    const warehouse = await db.query.warehouses.findFirst({
      where: and(eq(warehouses.tenantId, tenantId), eq(warehouses.code, row.warehousecode ?? "")),
    });
    if (!warehouse) {
      result.errors.push({ row: rowNumber, message: `Warehouse not found: ${row.warehousecode}` });
      continue;
    }

    const variant = await db.query.productVariants.findFirst({
      where: and(eq(productVariants.tenantId, tenantId), eq(productVariants.sku, row.sku ?? "")),
    });
    if (!variant) {
      result.errors.push({ row: rowNumber, message: `Product SKU not found: ${row.sku}` });
      continue;
    }

    balances.push({
      warehouseId: warehouse.id,
      productVariantId: variant.id,
      quantity,
      unitCost,
      batchNumber: row.batchnumber || undefined,
      expiryDate: row.expirydate || undefined,
    });
  }

  if (balances.length > 0) {
    const posted = await postOpeningStockBalances(tenantId, userId, branchId, asOfDate, balances);
    result.created = posted.count;
  }
  return result;
}
