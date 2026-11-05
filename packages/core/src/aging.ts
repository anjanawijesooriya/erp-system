/** Shared between payables (purchasing) and receivables (sales) aging reports. */
export type AgingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export function agingBucketFor(daysPastDue: number): AgingBucket {
  if (daysPastDue <= 0) return "current";
  if (daysPastDue <= 30) return "1-30";
  if (daysPastDue <= 60) return "31-60";
  if (daysPastDue <= 90) return "61-90";
  return "90+";
}
