import ExcelJS from "exceljs";

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  created: number;
  errors: ImportRowError[];
}

/**
 * Reads the first worksheet of an .xlsx buffer into an array of plain
 * objects keyed by the (lowercased, trimmed) header row — so a template
 * column "Base UoM Code" and a user-typed "base uom code" both match
 * `baseuomcode`. Callers map these loose keys to their own schema fields.
 */
export async function readWorksheetRows(buffer: Buffer): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
  });

  const rows: Record<string, string>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    let hasValue = false;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = headers[colNumber];
      if (!key) return;
      const value = cell.value;
      record[key] = value === null || value === undefined ? "" : String(value);
      if (record[key]) hasValue = true;
    });
    if (hasValue) rows.push(record);
  });

  return rows;
}
