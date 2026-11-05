import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@erp/db";
import { pilotIssues } from "@erp/db/schema";

export const issueInput = z.object({
  branchId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});
export type IssueInput = z.infer<typeof issueInput>;

export async function reportIssue(tenantId: string, userId: string, input: IssueInput) {
  const [row] = await db
    .insert(pilotIssues)
    .values({
      tenantId,
      branchId: input.branchId,
      title: input.title,
      description: input.description,
      severity: input.severity,
      reportedByUserId: userId,
    })
    .returning();
  return row;
}

export async function listIssues(tenantId: string) {
  return db.query.pilotIssues.findMany({
    where: eq(pilotIssues.tenantId, tenantId),
    orderBy: [desc(pilotIssues.createdAt)],
    with: { branch: true, reportedBy: true },
  });
}

export async function updateIssueStatus(
  tenantId: string,
  issueId: string,
  status: "open" | "in_progress" | "resolved" | "closed",
) {
  const [row] = await db
    .update(pilotIssues)
    .set({ status, resolvedAt: status === "resolved" || status === "closed" ? new Date() : null })
    .where(and(eq(pilotIssues.id, issueId), eq(pilotIssues.tenantId, tenantId)))
    .returning();
  return row;
}

/** Cross-tenant — for the super-admin panel only, no tenant filter by design. */
export async function updateIssueStatusAsAdmin(
  issueId: string,
  status: "open" | "in_progress" | "resolved" | "closed",
) {
  const [row] = await db
    .update(pilotIssues)
    .set({ status, resolvedAt: status === "resolved" || status === "closed" ? new Date() : null })
    .where(eq(pilotIssues.id, issueId))
    .returning();
  return row;
}

/** Cross-tenant — for the super-admin panel only. */
export async function listAllIssues() {
  return db.query.pilotIssues.findMany({
    orderBy: [desc(pilotIssues.createdAt)],
    with: { branch: true, reportedBy: true, tenant: true },
    limit: 200,
  });
}
