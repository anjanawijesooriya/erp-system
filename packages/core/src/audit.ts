import { db } from "@erp/db";
import { auditLogs } from "@erp/db/schema";
import type { TenantContext } from "./tenant-context";

export async function writeAuditLog(
  ctx: Pick<TenantContext, "tenantId" | "userId">,
  entry: {
    action: string;
    entityType: string;
    entityId?: string;
    before?: unknown;
    after?: unknown;
    ipAddress?: string;
  },
): Promise<void> {
  await db.insert(auditLogs).values({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    before: entry.before ?? null,
    after: entry.after ?? null,
    ipAddress: entry.ipAddress,
  });
}
