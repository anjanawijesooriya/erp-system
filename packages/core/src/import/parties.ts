import { createCustomer } from "../parties/customers";
import { createSupplier } from "../parties/suppliers";
import { partyInput } from "../parties/schemas";
import { readWorksheetRows, type ImportResult } from "./excel";

/**
 * Expected columns (case/space-insensitive): code, name, phone, email,
 * address, taxid, creditlimit, credittermdays.
 */
async function importPartiesFromExcel(
  buffer: Buffer,
  create: (tenantId: string, input: ReturnType<typeof partyInput.parse>) => Promise<unknown>,
  tenantId: string,
): Promise<ImportResult> {
  const rows = await readWorksheetRows(buffer);
  const result: ImportResult = { created: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNumber = i + 2;

    const parsed = partyInput.safeParse({
      code: row.code || undefined,
      name: row.name,
      phone: row.phone || undefined,
      email: row.email || undefined,
      address: row.address || undefined,
      taxId: row.taxid || undefined,
      creditLimit: row.creditlimit || undefined,
      creditTermDays: row.credittermdays || undefined,
    });

    if (!parsed.success) {
      result.errors.push({ row: rowNumber, message: parsed.error.issues.map((i) => i.message).join("; ") });
      continue;
    }

    try {
      await create(tenantId, parsed.data);
      result.created++;
    } catch (err) {
      result.errors.push({ row: rowNumber, message: err instanceof Error ? err.message : "Insert failed" });
    }
  }

  return result;
}

export function importCustomersFromExcel(tenantId: string, buffer: Buffer) {
  return importPartiesFromExcel(buffer, createCustomer, tenantId);
}

export function importSuppliersFromExcel(tenantId: string, buffer: Buffer) {
  return importPartiesFromExcel(buffer, createSupplier, tenantId);
}
