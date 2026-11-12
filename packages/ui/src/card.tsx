import * as React from "react";
import { cn } from "./cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}
      {...props}
    />
  );
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Consistent page title row: icon badge + title/description on the left, actions (e.g. a primary button) on the right. */
export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

/** Friendlier replacement for a bare "No X yet." table row. */
export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      {icon && <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">{icon}</span>}
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && <p className="max-w-sm text-xs text-slate-400">{description}</p>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "accent" | "rose" | "amber";
}) {
  const toneClass =
    tone === "accent"
      ? "text-accent-700"
      : tone === "rose"
        ? "text-rose-700"
        : tone === "amber"
          ? "text-amber-700"
          : "text-slate-900";
  return (
    <Card className="p-3.5 text-center">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold", toneClass)}>{value}</div>
    </Card>
  );
}
