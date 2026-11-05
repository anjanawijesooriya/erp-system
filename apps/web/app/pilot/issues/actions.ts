"use server";

import { revalidatePath } from "next/cache";
import { issueInput, reportIssue, updateIssueStatus } from "@erp/core/pilot";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function reportIssueAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.ISSUE_REPORT);

  const parsed = issueInput.safeParse({
    branchId: formData.get("branchId") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    severity: formData.get("severity") || "medium",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  await reportIssue(tenantId, userId, parsed.data);
  revalidatePath("/pilot/issues");
  return {};
}

export async function updateIssueStatusAction(
  issueId: string,
  status: "open" | "in_progress" | "resolved" | "closed",
) {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.ISSUE_MANAGE);
  await updateIssueStatus(tenantId, issueId, status);
  revalidatePath("/pilot/issues");
}
