"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAdminTenantAccess } from "@erp/core/platform-admin";
import { setPlan } from "@erp/core/plans";
import { updateIssueStatusAsAdmin } from "@erp/core/pilot";
import { clearAdminSession } from "@/lib/admin-session";
import { requireAdmin } from "@/lib/require-admin";

const planInput = z.object({
  tenantId: z.string().uuid(),
  plan: z.enum(["pos", "business", "erp"]),
});

export async function changePlanAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = planInput.safeParse({ tenantId: formData.get("tenantId"), plan: formData.get("plan") });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  await setPlan(parsed.data.tenantId, parsed.data.plan);
  revalidatePath("/admin");
  return {};
}

export async function viewTenantAction(tenantId: string) {
  const admin = await requireAdmin();
  await logAdminTenantAccess(admin.adminId, admin.email, tenantId);
  revalidatePath("/admin");
}

export async function adminUpdateIssueStatusAction(
  issueId: string,
  status: "open" | "in_progress" | "resolved" | "closed",
) {
  await requireAdmin();
  await updateIssueStatusAsAdmin(issueId, status);
  revalidatePath("/admin");
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
