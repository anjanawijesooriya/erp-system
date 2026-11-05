import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@erp/db";
import { cheques } from "@erp/db/schema";
import { postJournalEntry } from "./journal";

export const chequeInput = z.object({
  branchId: z.string().uuid(),
  direction: z.enum(["received", "issued"]),
  customerId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  chequeNumber: z.string().min(1).max(60),
  bankName: z.string().max(100).optional(),
  chequeDate: z.string().min(1),
  amount: z.coerce.number().positive(),
  note: z.string().max(500).optional(),
});
export type ChequeInput = z.infer<typeof chequeInput>;

export async function recordCheque(tenantId: string, userId: string, input: ChequeInput) {
  const [row] = await db
    .insert(cheques)
    .values({
      tenantId,
      branchId: input.branchId,
      direction: input.direction,
      customerId: input.customerId,
      supplierId: input.supplierId,
      chequeNumber: input.chequeNumber,
      bankName: input.bankName,
      chequeDate: input.chequeDate,
      amount: input.amount.toString(),
      note: input.note,
      createdByUserId: userId,
    })
    .returning();
  return row;
}

export async function listCheques(tenantId: string) {
  return db.query.cheques.findMany({
    where: eq(cheques.tenantId, tenantId),
    orderBy: [desc(cheques.chequeDate)],
    with: { customer: true, supplier: true },
  });
}

/**
 * `deposited` is a status-only transition (the cheque has been taken to
 * the bank but hasn't cleared yet) — no journal impact. `cleared` and
 * `bounced` post the matching entry: a cleared received cheque moves the
 * amount from PDC Receivable into Bank; a cleared issued cheque moves it
 * out of PDC Payable from Bank. A bounced cheque reverses back to the
 * original receivable/payable instead.
 */
export async function updateChequeStatus(
  tenantId: string,
  userId: string,
  chequeId: string,
  newStatus: "deposited" | "cleared" | "bounced" | "cancelled",
  entryDate: string,
) {
  return db.transaction(async (tx) => {
    const cheque = await tx.query.cheques.findFirst({
      where: and(eq(cheques.id, chequeId), eq(cheques.tenantId, tenantId)),
    });
    if (!cheque) throw new Error("Cheque not found");

    const [updated] = await tx
      .update(cheques)
      .set({ status: newStatus })
      .where(eq(cheques.id, chequeId))
      .returning();

    const amount = Number(cheque.amount);

    if (newStatus === "cleared") {
      const isReceived = cheque.direction === "received";
      await postJournalEntry(tx, {
        tenantId,
        branchId: cheque.branchId,
        entryDate,
        referenceType: "cheque_cleared",
        referenceId: chequeId,
        createdByUserId: userId,
        lines: isReceived
          ? [
              { accountCode: "1010", debit: amount, description: `Cheque ${cheque.chequeNumber} cleared` },
              { accountCode: "1300", credit: amount, description: `Cheque ${cheque.chequeNumber} cleared` },
            ]
          : [
              { accountCode: "2200", debit: amount, description: `Cheque ${cheque.chequeNumber} cleared` },
              { accountCode: "1010", credit: amount, description: `Cheque ${cheque.chequeNumber} cleared` },
            ],
      });
    } else if (newStatus === "bounced") {
      const isReceived = cheque.direction === "received";
      await postJournalEntry(tx, {
        tenantId,
        branchId: cheque.branchId,
        entryDate,
        referenceType: "cheque_bounced",
        referenceId: chequeId,
        createdByUserId: userId,
        lines: isReceived
          ? [
              { accountCode: "1100", debit: amount, description: `Cheque ${cheque.chequeNumber} bounced` },
              { accountCode: "1300", credit: amount, description: `Cheque ${cheque.chequeNumber} bounced` },
            ]
          : [
              { accountCode: "2200", debit: amount, description: `Cheque ${cheque.chequeNumber} bounced` },
              { accountCode: "2000", credit: amount, description: `Cheque ${cheque.chequeNumber} bounced` },
            ],
      });
    }

    return updated;
  });
}
