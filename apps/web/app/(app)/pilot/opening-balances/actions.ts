"use server";

import { revalidatePath } from "next/cache";
import {
  importOpeningCustomerBalances,
  importOpeningStockBalances,
  importOpeningSupplierBalances,
} from "@erp/core/pilot";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

type ImportState = { error?: string; summary?: string } | undefined;

async function handleImport(
  formData: FormData,
  run: (tenantId: string, userId: string, branchId: string, asOfDate: string, buffer: Buffer) => Promise<{ created: number; errors: { row: number; message: string }[] }>,
): Promise<{ error?: string; summary?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.OPENING_BALANCE_IMPORT);

  const branchId = formData.get("branchId");
  const asOfDate = formData.get("asOfDate");
  const file = formData.get("file");

  if (typeof branchId !== "string" || !branchId) return { error: "Branch is required." };
  if (typeof asOfDate !== "string" || !asOfDate) return { error: "As-of date is required." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an .xlsx file first." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await run(tenantId, userId, branchId, asOfDate, buffer);

  revalidatePath("/pilot/opening-balances");
  revalidatePath("/sales/receivables");
  revalidatePath("/purchasing/payables");
  revalidatePath("/inventory");

  const summary = `${result.created} posted, ${result.errors.length} error(s).`;
  if (result.errors.length > 0) {
    const detail = result.errors.slice(0, 5).map((e) => `row ${e.row}: ${e.message}`).join(" | ");
    return { summary: `${summary} ${detail}` };
  }
  return { summary };
}

export async function importOpeningCustomersAction(_prev: ImportState, formData: FormData) {
  return handleImport(formData, importOpeningCustomerBalances);
}

export async function importOpeningSuppliersAction(_prev: ImportState, formData: FormData) {
  return handleImport(formData, importOpeningSupplierBalances);
}

export async function importOpeningStockAction(_prev: ImportState, formData: FormData) {
  return handleImport(formData, importOpeningStockBalances);
}
