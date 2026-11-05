import { createProduct } from "../catalog/products";
import { productInput } from "../catalog/schemas";
import { readWorksheetRows, type ImportResult } from "./excel";

/**
 * Expected columns (case/space-insensitive): sku, name, description,
 * baseuomcode, costprice, sellingprice, barcode, tracksbatches.
 * Rows are inserted one at a time so a bad row doesn't abort the whole
 * file — see the `errors` array in the result instead.
 */
export async function importProductsFromExcel(tenantId: string, buffer: Buffer): Promise<ImportResult> {
  const rows = await readWorksheetRows(buffer);
  const result: ImportResult = { created: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNumber = i + 2; // header is row 1

    const parsed = productInput.safeParse({
      sku: row.sku,
      name: row.name,
      description: row.description || undefined,
      baseUomCode: row.baseuomcode,
      costPrice: row.costprice || undefined,
      sellingPrice: row.sellingprice || undefined,
      barcode: row.barcode || undefined,
      tracksBatches: ["true", "1", "yes"].includes((row.tracksbatches ?? "").toLowerCase()),
    });

    if (!parsed.success) {
      result.errors.push({ row: rowNumber, message: parsed.error.issues.map((i) => i.message).join("; ") });
      continue;
    }

    try {
      await createProduct(tenantId, parsed.data);
      result.created++;
    } catch (err) {
      result.errors.push({ row: rowNumber, message: err instanceof Error ? err.message : "Insert failed" });
    }
  }

  return result;
}
