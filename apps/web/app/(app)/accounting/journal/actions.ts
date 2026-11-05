"use server";

import { revalidatePath } from "next/cache";
import { manualJournalInput, postManualJournalEntry, voidJournalEntry } from "@erp/core/accounting";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function postManualJournalAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.JOURNAL_POST);

  const linesRaw = formData.get("lines");
  let lines: unknown;
  try {
    lines = JSON.parse(typeof linesRaw === "string" ? linesRaw : "[]");
  } catch {
    return { error: "Invalid line data." };
  }

  const parsed = manualJournalInput.safeParse({
    branchId: formData.get("branchId"),
    entryDate: formData.get("entryDate"),
    memo: formData.get("memo") || undefined,
    lines,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await postManualJournalEntry(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to post journal entry" };
  }

  revalidatePath("/accounting/journal");
  revalidatePath("/accounting/reports");
  return {};
}

export async function voidJournalEntryAction(entryId: string, branchId: string) {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.JOURNAL_POST);
  await voidJournalEntry(tenantId, userId, branchId, entryId);
  revalidatePath("/accounting/journal");
  revalidatePath("/accounting/reports");
}
