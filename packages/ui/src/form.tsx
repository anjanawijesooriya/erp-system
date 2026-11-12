import * as React from "react";
import { cn } from "./cn";

export interface FormHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

/** Title strip at the top of a form card — gives every create-form a consistent, identifiable header instead of starting straight into fields. */
export function FormHeader({ icon, title, description }: FormHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
          {icon}
        </span>
      )}
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
    </div>
  );
}

/** Field grid body of a form card — use as the direct child grid wrapping labeled fields. */
export function FormBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-3", className)} {...props} />;
}

/** Full-width divider label inside a FormBody grid, e.g. "Line items" separating a sub-section from the main fields. */
export function FormSectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("col-span-full -mx-5 -mb-1 border-t border-slate-100 bg-slate-50/50 px-5 py-2", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</span>
    </div>
  );
}

/** Action row at the bottom of a form card, visually separated from the fields above. */
export function FormFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5", className)}
      {...props}
    />
  );
}
