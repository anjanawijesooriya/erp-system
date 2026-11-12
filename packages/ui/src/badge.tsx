import * as React from "react";
import { cn } from "./cn";

export type BadgeTone = "slate" | "brand" | "accent" | "amber" | "rose" | "violet" | "sky";

/**
 * Tone names are kept generic (accent/amber/rose/sky) so call sites don't
 * need to change, but each now points at the exact semantic hex from the
 * Vertex ERP mockups: accent=success, amber=warning, rose=danger, sky=info.
 */
const TONE_CLASSES: Record<BadgeTone, string> = {
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  accent: "bg-success-50 text-success-700 ring-success-100",
  amber: "bg-warning-50 text-warning-700 ring-warning-100",
  rose: "bg-danger-50 text-danger-700 ring-danger-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  sky: "bg-info-50 text-info-700 ring-info-100",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

/** Small status pill used across list tables (order/invoice/payment status, aging buckets, etc). */
export function Badge({ tone = "slate", dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", TONE_CLASSES[tone].split(" ")[1]?.replace("text-", "bg-"))} />}
      {children}
    </span>
  );
}

/** Maps a document/invoice/order status string to a consistent badge tone across the app. */
export function toneForStatus(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (["paid", "closed", "completed", "received", "posted", "active"].includes(s)) return "accent";
  if (["draft", "open", "pending", "partially_paid", "partial"].includes(s)) return "amber";
  if (["cancelled", "canceled", "void", "overdue", "rejected"].includes(s)) return "rose";
  if (["ordered", "in_transit", "processing"].includes(s)) return "sky";
  return "slate";
}
