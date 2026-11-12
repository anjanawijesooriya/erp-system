"use client";

import * as React from "react";
import { cn } from "./cn";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Label for the left-hand "Showing X–Y of Z" text; pass the already-formatted string. */
  summary?: string;
}

function pageButtonClass(active: boolean) {
  return cn(
    "flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
    active ? "border-brand-700 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
  );
}

/** Simple numbered pagination for client-side-paged tables. Caps visible page buttons so it stays usable with many pages. */
export function Pagination({ page, totalPages, onChange, summary }: PaginationProps) {
  if (totalPages <= 1) return null;

  const maxButtons = 5;
  let start = Math.max(1, page - Math.floor(maxButtons / 2));
  const end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
      {summary && <span className="text-xs text-slate-400">{summary}</span>}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className={cn(pageButtonClass(false), "disabled:opacity-40")}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pages.map((p) => (
          <button key={p} type="button" onClick={() => onChange(p)} className={pageButtonClass(p === page)}>
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={cn(pageButtonClass(false), "disabled:opacity-40")}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
