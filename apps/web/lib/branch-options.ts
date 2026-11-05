import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { branches } from "@erp/db/schema";

export async function getBranchOptions(tenantId: string) {
  return db.query.branches.findMany({ where: eq(branches.tenantId, tenantId) });
}
