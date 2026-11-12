import * as React from "react";
import { cn } from "./cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors",
      "placeholder:text-slate-400",
      "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
      "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors",
      "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500", className)}
      {...props}
    />
  );
}
