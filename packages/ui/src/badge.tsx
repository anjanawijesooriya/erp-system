import * as React from "react";
import { cn } from "./cn";

export type BadgeTone = "slate" | "brand" | "accent" | "amber" | "rose" | "violet" | "sky";

const TONE_CLASSES: Record<BadgeTone, string> = {
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  accent: "bg-accent-50 text-accent-700 ring-accent-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
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
