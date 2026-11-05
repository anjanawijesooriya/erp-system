import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { roles } from "@erp/db/schema";

export async function listRoles(tenantId: string) {
  return db.query.roles.findMany({
    where: eq(roles.tenantId, tenantId),
    orderBy: (r, { asc }) => [asc(r.name)],
  });
}
