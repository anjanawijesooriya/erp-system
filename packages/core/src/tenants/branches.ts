import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@erp/db";
import { branches } from "@erp/db/schema";
import { assertWithinLimit } from "../plans/feature-gate";

export const branchInput = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20),
  address: z.string().max(500).optional(),
});
export type BranchInput = z.infer<typeof branchInput>;

export async function listBranches(tenantId: string) {
  return db.query.branches.findMany({ where: eq(branches.tenantId, tenantId), orderBy: (b, { asc }) => [asc(b.name)] });
}

export async function createBranch(tenantId: string, input: BranchInput) {
  await assertWithinLimit(tenantId, "maxBranches");
  const [row] = await db
    .insert(branches)
    .values({ tenantId, name: input.name, code: input.code, address: input.address })
    .returning();
  return row;
}
