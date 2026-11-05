/**
 * Advance Personal Income Tax (APIT, Sri Lanka's PAYE-equivalent) on
 * regular monthly employment income. Brackets below are the ones in
 * effect from 2024/2025 (Inland Revenue Department) — **these change with
 * the national budget almost every year**, so this table is a
 * configurable default, not a hardcoded guarantee of correctness. A
 * payroll run always records the exact `apitAmount` it computed on the
 * payroll_run_lines row, so changing this table later never silently
 * rewrites a past, already-posted payroll run.
 *
 * Computed on (gross salary − employee EPF 8%), the standard APIT base.
 */
export interface ApitBracket {
  /** Upper bound of taxable income in this bracket, in LKR. Infinity for the top bracket. */
  upTo: number;
  rate: number; // e.g. 0.06 for 6%
}

export const APIT_MONTHLY_BRACKETS: ApitBracket[] = [
  { upTo: 100_000, rate: 0 },
  { upTo: 141_667, rate: 0.06 },
  { upTo: 183_333, rate: 0.18 },
  { upTo: 225_000, rate: 0.24 },
  { upTo: 266_667, rate: 0.3 },
  { upTo: Infinity, rate: 0.36 },
];

/** Standard marginal-bracket calculation: each slice of income is taxed at its own bracket's rate. */
export function calculateApit(taxableMonthlyIncome: number, brackets: ApitBracket[] = APIT_MONTHLY_BRACKETS): number {
  if (taxableMonthlyIncome <= 0) return 0;

  let tax = 0;
  let lowerBound = 0;
  for (const bracket of brackets) {
    if (taxableMonthlyIncome <= lowerBound) break;
    const sliceTop = Math.min(taxableMonthlyIncome, bracket.upTo);
    const sliceAmount = sliceTop - lowerBound;
    if (sliceAmount > 0) tax += sliceAmount * bracket.rate;
    lowerBound = bracket.upTo;
  }
  return Math.round(tax * 100) / 100;
}
