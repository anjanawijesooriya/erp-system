import { sql } from "drizzle-orm";
import { docNumberSequences } from "@erp/db/schema";
import type { DbTx, TenantContext } from "./tenant-context";

/**
 * Allocates the next gapless document number for (tenant, branch, docType),
 * e.g. "INV-COL-000123". Build-plan rule #5. Must run inside the same
 * transaction as the document insert, so a failed insert rolls the
 * sequence back too — never allocate the number and then insert separately.
 */
export async function nextDocNumber(
  tx: DbTx,
  ctx: Pick<TenantContext, "tenantId" | "branchId">,
  docType: string,
  prefix: string,
  padding = 6,
): Promise<string> {
  if (!ctx.branchId) {
    throw new Error("nextDocNumber requires a branchId");
  }

  const [row] = await tx
    .insert(docNumberSequences)
    .values({
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      docType,
      prefix,
      lastNumber: 1,
    })
    .onConflictDoUpdate({
      target: [docNumberSequences.tenantId, docNumberSequences.branchId, docNumberSequences.docType],
      set: { lastNumber: sql`${docNumberSequences.lastNumber} + 1`, updatedAt: new Date() },
    })
    .returning({ lastNumber: docNumberSequences.lastNumber, branchCode: docNumberSequences.branchId });

  if (!row) {
    throw new Error("Failed to allocate document number");
  }

  const branch = await tx.query.branches.findFirst({
    where: (b, { eq: eqOp }) => eqOp(b.id, ctx.branchId!),
    columns: { code: true },
  });

  const branchCode = branch?.code ?? "XXX";
  const number = String(row.lastNumber).padStart(padding, "0");
  return `${prefix}-${branchCode}-${number}`;
}
