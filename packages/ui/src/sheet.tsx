"use client";

import * as React from "react";
import { cn } from "./cn";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  width?: "md" | "lg" | "xl";
  children: React.ReactNode;
}

const WIDTH_CLASSES: Record<NonNullable<SheetProps["width"]>, string> = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
};

/**
 * Slide-over panel from the right — used for both "create" forms (wide
 * enough for a line-item table) and read-only document detail views, so a
 * list page can stay table-first instead of showing a form above every table.
 */
export function Sheet({ open, onClose, title, description, icon, width = "lg", children }: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] print:hidden">
      <div
        className="absolute inset-0 bg-slate-900/40"
        style={{ animation: "overlay-in 0.15s ease-out" }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl",
          WIDTH_CLASSES[width],
        )}
        style={{ animation: "sheet-in 0.2s ease-out" }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            {icon && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                {icon}
              </span>
            )}
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
              {description && <p className="text-xs text-slate-500">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 px-5 py-4">
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </div>
  );
}
