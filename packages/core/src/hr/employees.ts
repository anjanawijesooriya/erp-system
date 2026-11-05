import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { employees } from "@erp/db/schema";
import { z } from "zod";

export const employeeInput = z.object({
  branchId: z.string().uuid(),
  linkedUserId: z.string().uuid().optional().nullable(),
  employeeNumber: z.string().min(1),
  name: z.string().min(1),
  nic: z.string().optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  dateOfJoining: z.string(),
  basicSalary: z.coerce.number().nonnegative(),
  fixedAllowances: z.coerce.number().nonnegative().default(0),
  epfMemberNumber: z.string().optional(),
  etfMemberNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
});
export type EmployeeInput = z.infer<typeof employeeInput>;

export async function createEmployee(tenantId: string, input: EmployeeInput) {
  const [row] = await db
    .insert(employees)
    .values({
      tenantId,
      branchId: input.branchId,
      linkedUserId: input.linkedUserId ?? null,
      employeeNumber: input.employeeNumber,
      name: input.name,
      nic: input.nic,
      phone: input.phone,
      designation: input.designation,
      dateOfJoining: input.dateOfJoining,
      basicSalary: input.basicSalary.toString(),
      fixedAllowances: input.fixedAllowances.toString(),
      epfMemberNumber: input.epfMemberNumber,
      etfMemberNumber: input.etfMemberNumber,
      bankName: input.bankName,
      bankAccountNumber: input.bankAccountNumber,
    })
    .returning();
  return row;
}

export async function listEmployees(tenantId: string) {
  return db.query.employees.findMany({
    where: eq(employees.tenantId, tenantId),
    with: { branch: true },
    orderBy: (t, { asc }) => [asc(t.employeeNumber)],
  });
}

export async function listActiveEmployees(tenantId: string, branchId?: string) {
  return db.query.employees.findMany({
    where: and(
      eq(employees.tenantId, tenantId),
      eq(employees.status, "active"),
      ...(branchId ? [eq(employees.branchId, branchId)] : []),
    ),
  });
}

export async function terminateEmployee(tenantId: string, employeeId: string, dateOfLeaving: string) {
  const [row] = await db
    .update(employees)
    .set({ status: "terminated", dateOfLeaving })
    .where(and(eq(employees.id, employeeId), eq(employees.tenantId, tenantId)))
    .returning();
  return row;
}
