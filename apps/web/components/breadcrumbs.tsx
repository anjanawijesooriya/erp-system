"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS, PINNED_LINKS, FOOTER_LINKS } from "./app-nav";

const ALL_LINKS = [...PINNED_LINKS, ...NAV_GROUPS.flatMap((g) => g.links), ...FOOTER_LINKS];

function titleCase(segment: string) {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Derives a "Section / Page" trail from the current path and the nav link labels, falling back to a title-cased segment for pages without a nav entry. */
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((_, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const known = ALL_LINKS.find((l) => l.href === href);
    return { href, label: known?.label ?? titleCase(segments[i] ?? "") };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-300">/</span>}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-slate-600">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-slate-600">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
