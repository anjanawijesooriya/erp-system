"use server";

import { revalidatePath } from "next/cache";
import { markPayrollPaid, runPayroll } from "@erp/core/hr";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { assertModule } from "@erp/core/plans";
import { requireSession } from "@/lib/session";

export async function runPayrollAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "payroll");
  await assertCan(userId, PERMISSIONS.PAYROLL_PROCESS);

  const branchId = String(formData.get("branchId") ?? "");
  const periodYear = Number(formData.get("periodYear"));
  const periodMonth = Number(formData.get("periodMonth"));
  if (!branchId || !periodYear || !periodMonth) {
    return { error: "Branch and period are required" };
  }

  try {
    await runPayroll(tenantId, branchId, userId, periodYear, periodMonth);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to run payroll" };
  }
  revalidatePath("/hr/payroll");
  return {};
}

export async function markPayrollPaidAction(payrollRunId: string, payFromAccountCode: "1000" | "1010") {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "payroll");
  await assertCan(userId, PERMISSIONS.PAYROLL_PROCESS);
  await markPayrollPaid(tenantId, userId, payrollRunId, payFromAccountCode);
  revalidatePath("/hr/payroll");
}
