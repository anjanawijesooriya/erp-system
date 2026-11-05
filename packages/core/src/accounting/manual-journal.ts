import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@erp/db";
import { journalEntries } from "@erp/db/schema";
import { postJournalEntry, reverseJournalEntry } from "./journal";

const manualLineInput = z.object({
  accountCode: z.string().min(1),
  debit: z.coerce.number().nonnegative().optional().default(0),
  credit: z.coerce.number().nonnegative().optional().default(0),
  description: z.string().max(200).optional(),
});

export const manualJournalInput = z.object({
  branchId: z.string().uuid(),
  entryDate: z.string().min(1),
  memo: z.string().max(500).optional(),
  lines: z.array(manualLineInput).min(2),
});
export type ManualJournalInput = z.infer<typeof manualJournalInput>;

export async function postManualJournalEntry(tenantId: string, userId: string, input: ManualJournalInput) {
  return db.transaction((tx) =>
    postJournalEntry(tx, {
      tenantId,
      branchId: input.branchId,
      entryDate: input.entryDate,
      referenceType: "manual",
      memo: input.memo,
      createdByUserId: userId,
      lines: input.lines,
    }),
  );
}

export async function voidJournalEntry(tenantId: string, userId: string, branchId: string, entryId: string) {
  return db.transaction((tx) => reverseJournalEntry(tx, tenantId, branchId, userId, entryId));
}

export async function listJournalEntries(tenantId: string) {
  return db.query.journalEntries.findMany({
    where: eq(journalEntries.tenantId, tenantId),
    orderBy: [desc(journalEntries.entryDate), desc(journalEntries.createdAt)],
    with: { lines: { with: { account: true } } },
  });
}
