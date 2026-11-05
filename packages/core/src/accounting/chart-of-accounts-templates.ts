export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export interface AccountTemplateEntry {
  code: string;
  name: string;
  type: AccountType;
  isSystemAccount?: boolean;
  /** Code of the parent account in this same template, if any. */
  parentCode?: string;
}

/**
 * Baseline accounts every tenant needs regardless of business type. Codes
 * are the stable identifiers later phases' automatic posting logic (e.g.
 * "post a sales invoice") targets — do not renumber these once in use.
 */
const BASE_ACCOUNTS: AccountTemplateEntry[] = [
  { code: "1000", name: "Cash in Hand", type: "asset", isSystemAccount: true },
  { code: "1010", name: "Bank", type: "asset", isSystemAccount: true },
  { code: "1100", name: "Accounts Receivable", type: "asset", isSystemAccount: true },
  { code: "1200", name: "Inventory", type: "asset", isSystemAccount: true },
  // Accrual clearing account: a GRN debits this (goods physically received,
  // not yet billed); the matching supplier invoice credits it back to zero
  // and credits Accounts Payable instead. See packages/core/src/accounting/auto-posting.ts.
  { code: "1250", name: "GRN Clearing", type: "asset", isSystemAccount: true },
  // Post-dated cheques: moved here from the wholesale-only extras now that
  // Phase 6 gives every business type cheque/PDC tracking, not just wholesale.
  { code: "1300", name: "Post-Dated Cheques Receivable", type: "asset", isSystemAccount: true },
  { code: "2000", name: "Accounts Payable", type: "liability", isSystemAccount: true },
  { code: "2100", name: "VAT Payable", type: "liability", isSystemAccount: true },
  { code: "2200", name: "Post-Dated Cheques Payable", type: "liability", isSystemAccount: true },
  // Phase 9 payroll liabilities — see packages/core/src/hr/payroll.ts.
  { code: "2300", name: "EPF Payable", type: "liability", isSystemAccount: true },
  { code: "2310", name: "ETF Payable", type: "liability", isSystemAccount: true },
  { code: "2320", name: "APIT Payable", type: "liability", isSystemAccount: true },
  { code: "2330", name: "Net Salaries Payable", type: "liability", isSystemAccount: true },
  { code: "3000", name: "Owner's Equity", type: "equity", isSystemAccount: true },
  // The offsetting side of every opening-balance entry (stock, AR, AP) when
  // a pilot shop goes live with existing operations — see
  // packages/core/src/pilot/opening-balances.ts. Never touched by ordinary
  // day-to-day postings, only by the one-time go-live import.
  { code: "3800", name: "Opening Balance Equity", type: "equity", isSystemAccount: true },
  { code: "3900", name: "Retained Earnings", type: "equity", isSystemAccount: true },
  { code: "4000", name: "Sales Revenue", type: "income", isSystemAccount: true },
  { code: "4100", name: "Sales Returns & Allowances", type: "income", isSystemAccount: true },
  { code: "5000", name: "Cost of Goods Sold", type: "expense", isSystemAccount: true },
  { code: "6000", name: "General & Administrative Expenses", type: "expense" },
  { code: "6100", name: "Rent Expense", type: "expense", parentCode: "6000" },
  { code: "6200", name: "Utilities Expense", type: "expense", parentCode: "6000" },
  { code: "6300", name: "Salaries & Wages", type: "expense", parentCode: "6000" },
  // Employer's own cost, on top of gross salary — see hr/payroll.ts.
  { code: "6310", name: "EPF Employer Contribution", type: "expense", parentCode: "6000" },
  { code: "6320", name: "ETF Contribution", type: "expense", parentCode: "6000" },
];

const BUSINESS_TYPE_EXTRAS: Record<string, AccountTemplateEntry[]> = {
  pharmacy: [
    { code: "5100", name: "Expired/Damaged Stock Write-off", type: "expense" },
  ],
  hardware: [
    { code: "6400", name: "Quotation Discounts Given", type: "expense" },
  ],
  grocery: [{ code: "5200", name: "Shrinkage / Wastage", type: "expense" }],
  textile: [{ code: "6500", name: "Alteration & Tailoring Costs", type: "expense" }],
  wholesale: [],
};

/** Returns the full account template (base + business-type extras) for a tenant. */
export function getChartOfAccountsTemplate(businessType?: string | null): AccountTemplateEntry[] {
  const extras = (businessType && BUSINESS_TYPE_EXTRAS[businessType]) || [];
  return [...BASE_ACCOUNTS, ...extras];
}
