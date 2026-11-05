import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { payrollRunLines, payrollRuns } from "@erp/db/schema";
import { postJournalEntry } from "../accounting/journal";
import { calculateApit } from "./apit";
import { listActiveEmployees } from "./employees";

const EPF_EMPLOYEE_RATE = 0.08;
const EPF_EMPLOYER_RATE = 0.12;
const ETF_RATE = 0.03;

export class PayrollAlreadyRunError extends Error {
  constructor(year: number, month: number) {
    super(`Payroll for ${year}-${String(month).padStart(2, "0")} has already been run for this branch`);
    this.name = "PayrollAlreadyRunError";
  }
}

/**
 * Computes and posts one payroll run for every active employee at
 * `branchId`, in a single transaction: writes the per-employee lines,
 * then one summary journal entry (gross salary + employer EPF/ETF as
 * expenses; EPF/ETF/APIT payable and net-pay-payable as liabilities —
 * paying employees out is a separate step, `markPayrollPaid` below, so
 * "processed" and "paid" are never conflated).
 */
export async function runPayroll(
  tenantId: string,
  branchId: string,
  userId: string,
  periodYear: number,
  periodMonth: number,
) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.payrollRuns.findFirst({
      where: and(
        eq(payrollRuns.tenantId, tenantId),
        eq(payrollRuns.branchId, branchId),
        eq(payrollRuns.periodYear, periodYear),
        eq(payrollRuns.periodMonth, periodMonth),
      ),
    });
    if (existing) throw new PayrollAlreadyRunError(periodYear, periodMonth);

    const activeEmployees = await listActiveEmployees(tenantId, branchId);
    if (activeEmployees.length === 0) {
      throw new Error("No active employees at this branch to run payroll for");
    }

    const [run] = await tx
      .insert(payrollRuns)
      .values({ tenantId, branchId, periodYear, periodMonth, createdByUserId: userId })
      .returning();
    if (!run) throw new Error("Failed to create payroll run");

    let totalGross = 0;
    let totalEpfEmployee = 0;
    let totalEpfEmployer = 0;
    let totalEtf = 0;
    let totalApit = 0;
    let totalNet = 0;

    for (const emp of activeEmployees) {
      const basic = Number(emp.basicSalary);
      const allowances = Number(emp.fixedAllowances);
      const gross = basic + allowances;
      const epfEmployee = Math.round(basic * EPF_EMPLOYEE_RATE * 100) / 100;
      const epfEmployer = Math.round(basic * EPF_EMPLOYER_RATE * 100) / 100;
      const etf = Math.round(basic * ETF_RATE * 100) / 100;
      const apit = calculateApit(gross - epfEmployee);
      const net = Math.round((gross - epfEmployee - apit) * 100) / 100;

      await tx.insert(payrollRunLines).values({
        payrollRunId: run.id,
        employeeId: emp.id,
        basicSalary: basic.toString(),
        fixedAllowances: allowances.toString(),
        grossSalary: gross.toString(),
        epfEmployeeAmount: epfEmployee.toString(),
        epfEmployerAmount: epfEmployer.toString(),
        etfAmount: etf.toString(),
        apitAmount: apit.toString(),
        netSalary: net.toString(),
      });

      totalGross += gross;
      totalEpfEmployee += epfEmployee;
      totalEpfEmployer += epfEmployer;
      totalEtf += etf;
      totalApit += apit;
      totalNet += net;
    }

    const entryDate = new Date(periodYear, periodMonth, 0).toISOString().slice(0, 10); // last day of the period month

    // APIT is frequently zero below the tax-free threshold — omit any
    // zero-amount line rather than posting a degenerate debit=0/credit=0
    // line (postJournalEntry requires exactly one of the two to be set).
    const candidateLines = [
      { accountCode: "6300", debit: totalGross, description: "Gross salaries" },
      { accountCode: "6310", debit: totalEpfEmployer, description: "EPF employer contribution" },
      { accountCode: "6320", debit: totalEtf, description: "ETF contribution" },
      { accountCode: "2300", credit: totalEpfEmployee + totalEpfEmployer, description: "EPF payable (employee + employer)" },
      { accountCode: "2310", credit: totalEtf, description: "ETF payable" },
      { accountCode: "2320", credit: totalApit, description: "APIT payable" },
      { accountCode: "2330", credit: totalNet, description: "Net salaries payable" },
    ];
    const lines = candidateLines.filter((l) => (l.debit ?? 0) > 0 || (l.credit ?? 0) > 0);

    const entry = await postJournalEntry(tx, {
      tenantId,
      branchId,
      entryDate,
      referenceType: "payroll_run",
      referenceId: run.id,
      createdByUserId: userId,
      memo: `Payroll ${periodYear}-${String(periodMonth).padStart(2, "0")}`,
      lines,
    });

    const [posted] = await tx
      .update(payrollRuns)
      .set({ status: "posted", journalEntryId: entry.id, postedAt: new Date() })
      .where(eq(payrollRuns.id, run.id))
      .returning();

    return posted;
  });
}

/** The actual bank/cash disbursement to employees, once the run above has been posted. */
export async function markPayrollPaid(
  tenantId: string,
  userId: string,
  payrollRunId: string,
  payFromAccountCode: "1000" | "1010",
) {
  return db.transaction(async (tx) => {
    const run = await tx.query.payrollRuns.findFirst({
      where: and(eq(payrollRuns.id, payrollRunId), eq(payrollRuns.tenantId, tenantId)),
      with: { lines: true },
    });
    if (!run) throw new Error("Payroll run not found");
    if (run.status !== "posted") throw new Error("Payroll run must be posted before it can be marked paid");

    const totalNet = run.lines.reduce((sum, l) => sum + Number(l.netSalary), 0);

    const entry = await postJournalEntry(tx, {
      tenantId,
      branchId: run.branchId,
      entryDate: new Date().toISOString().slice(0, 10),
      referenceType: "payroll_payment",
      referenceId: run.id,
      createdByUserId: userId,
      memo: `Payroll payment ${run.periodYear}-${String(run.periodMonth).padStart(2, "0")}`,
      lines: [
        { accountCode: "2330", debit: totalNet, description: "Net salaries paid" },
        { accountCode: payFromAccountCode, credit: totalNet, description: "Net salaries paid" },
      ],
    });

    const [paid] = await tx
      .update(payrollRuns)
      .set({ status: "paid", paymentJournalEntryId: entry.id, paidAt: new Date() })
      .where(eq(payrollRuns.id, run.id))
      .returning();

    return paid;
  });
}

export async function listPayrollRuns(tenantId: string) {
  return db.query.payrollRuns.findMany({
    where: eq(payrollRuns.tenantId, tenantId),
    with: { branch: true, lines: { with: { employee: true } } },
    orderBy: (t, { desc }) => [desc(t.periodYear), desc(t.periodMonth)],
  });
}
