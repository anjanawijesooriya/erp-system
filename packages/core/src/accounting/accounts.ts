import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { ledgerAccounts } from "@erp/db/schema";

export async function listAccounts(tenantId: string) {
  return db.query.ledgerAccounts.findMany({
    where: eq(ledgerAccounts.tenantId, tenantId),
    orderBy: (a, { asc }) => [asc(a.code)],
  });
}
