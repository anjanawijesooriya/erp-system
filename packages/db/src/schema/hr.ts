import { relations } from "drizzle-orm";
import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { branches, tenants } from "./tenants";
import { users } from "./users";

// --- Phase 9: HR & payroll (EPF/ETF/APIT) -------------------------------------------------------

export const employmentStatusEnum = pgEnum("employment_status", ["active", "terminated"]);

/**
 * A payroll employee is deliberately separate from `users` — most shop
 * staff being paid (e.g. warehouse helpers, delivery riders) never log
 * into the system at all, and a `users` row that *does* log in (a
 * Cashier) isn't necessarily on payroll. `linkedUserId` is an optional
 * bridge for the common case where they're the same person.
 */
export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "restrict" }),
    linkedUserId: uuid("linked_user_id").references(() => users.id, { onDelete: "set null" }),
    employeeNumber: text("employee_number").notNull(),
    name: text("name").notNull(),
    nic: text("nic"),
    phone: text("phone"),
    designation: text("designation"),
    dateOfJoining: date("date_of_joining").notNull(),
    dateOfLeaving: date("date_of_leaving"),
    status: employmentStatusEnum("status").notNull().default("active"),
    // Statutory base: EPF/ETF are computed on this, not on allowances —
    // see packages/core/src/hr/payroll.ts.
    basicSalary: numeric("basic_salary", { precision: 14, scale: 2 }).notNull(),
    fixedAllowances: numeric("fixed_allowances", { precision: 14, scale: 2 }).notNull().default("0"),
    epfMemberNumber: text("epf_member_number"),
    etfMemberNumber: text("etf_member_number"),
    bankName: text("bank_name"),
    bankAccountNumber: text("bank_account_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("employees_tenant_number_idx").on(table.tenantId, table.employeeNumber)],
);

export const payrollRunStatusEnum = pgEnum("payroll_run_status", ["draft", "posted", "paid"]);

/** One per (tenant, period). Posting creates the GL entry; paying is a separate step (see payroll.ts). */
export const payrollRuns = pgTable(
  "payroll_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "restrict" }),
    periodYear: integer("period_year").notNull(),
    periodMonth: integer("period_month").notNull(), // 1-12
    status: payrollRunStatusEnum("status").notNull().default("draft"),
    journalEntryId: uuid("journal_entry_id"),
    paymentJournalEntryId: uuid("payment_journal_entry_id"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("payroll_runs_tenant_period_idx").on(table.tenantId, table.branchId, table.periodYear, table.periodMonth),
  ],
);

export const payrollRunLines = pgTable("payroll_run_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  payrollRunId: uuid("payroll_run_id")
    .notNull()
    .references(() => payrollRuns.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "restrict" }),
  basicSalary: numeric("basic_salary", { precision: 14, scale: 2 }).notNull(),
  fixedAllowances: numeric("fixed_allowances", { precision: 14, scale: 2 }).notNull(),
  grossSalary: numeric("gross_salary", { precision: 14, scale: 2 }).notNull(),
  epfEmployeeAmount: numeric("epf_employee_amount", { precision: 14, scale: 2 }).notNull(),
  epfEmployerAmount: numeric("epf_employer_amount", { precision: 14, scale: 2 }).notNull(),
  etfAmount: numeric("etf_amount", { precision: 14, scale: 2 }).notNull(),
  apitAmount: numeric("apit_amount", { precision: 14, scale: 2 }).notNull(),
  netSalary: numeric("net_salary", { precision: 14, scale: 2 }).notNull(),
});

export const employeesRelations = relations(employees, ({ one }) => ({
  branch: one(branches, { fields: [employees.branchId], references: [branches.id] }),
  linkedUser: one(users, { fields: [employees.linkedUserId], references: [users.id] }),
}));

export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
  branch: one(branches, { fields: [payrollRuns.branchId], references: [branches.id] }),
  lines: many(payrollRunLines),
}));

export const payrollRunLinesRelations = relations(payrollRunLines, ({ one }) => ({
  payrollRun: one(payrollRuns, { fields: [payrollRunLines.payrollRunId], references: [payrollRuns.id] }),
  employee: one(employees, { fields: [payrollRunLines.employeeId], references: [employees.id] }),
}));
