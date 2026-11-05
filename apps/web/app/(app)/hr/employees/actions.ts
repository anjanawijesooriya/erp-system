"use server";

import { revalidatePath } from "next/cache";
import { createEmployee, employeeInput, terminateEmployee } from "@erp/core/hr";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { assertModule } from "@erp/core/plans";
import { requireSession } from "@/lib/session";

export async function createEmployeeAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "payroll");
  await assertCan(userId, PERMISSIONS.EMPLOYEE_MANAGE);

  const parsed = employeeInput.safeParse({
    branchId: formData.get("branchId"),
    employeeNumber: formData.get("employeeNumber"),
    name: formData.get("name"),
    nic: formData.get("nic") || undefined,
    phone: formData.get("phone") || undefined,
    designation: formData.get("designation") || undefined,
    dateOfJoining: formData.get("dateOfJoining"),
    basicSalary: formData.get("basicSalary"),
    fixedAllowances: formData.get("fixedAllowances") || 0,
    epfMemberNumber: formData.get("epfMemberNumber") || undefined,
    etfMemberNumber: formData.get("etfMemberNumber") || undefined,
    bankName: formData.get("bankName") || undefined,
    bankAccountNumber: formData.get("bankAccountNumber") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  await createEmployee(tenantId, parsed.data);
  revalidatePath("/hr/employees");
  return {};
}

export async function terminateEmployeeAction(employeeId: string, dateOfLeaving: string) {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "payroll");
  await assertCan(userId, PERMISSIONS.EMPLOYEE_MANAGE);
  await terminateEmployee(tenantId, employeeId, dateOfLeaving);
  revalidatePath("/hr/employees");
}
