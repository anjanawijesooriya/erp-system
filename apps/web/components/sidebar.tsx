"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FOOTER_LINKS, NAV_GROUPS, PINNED_LINKS, type NavGroup } from "./app-nav";
import { CartIcon, ChartIcon, ChevronIcon, HomeIcon, SettingsIcon, UsersIcon } from "./icons";

const PINNED_ICONS: Record<string, (props: { className?: string }) => React.ReactElement> = {
  "/dashboard": HomeIcon,
  "/pos": CartIcon,
  "/reports": ChartIcon,
};

const COLOR_CLASSES: Record<NavGroup["color"], { dot: string; activeBg: string; activeText: string; border: string }> = {
  brand: { dot: "bg-brand-500", activeBg: "bg-brand-50", activeText: "text-brand-700", border: "border-brand-500" },
  accent: { dot: "bg-accent-500", activeBg: "bg-accent-50", activeText: "text-accent-700", border: "border-accent-500" },
  amber: { dot: "bg-amber-500", activeBg: "bg-amber-50", activeText: "text-amber-700", border: "border-amber-500" },
  rose: { dot: "bg-rose-500", activeBg: "bg-rose-50", activeText: "text-rose-700", border: "border-rose-500" },
  violet: { dot: "bg-violet-500", activeBg: "bg-violet-50", activeText: "text-violet-700", border: "border-violet-500" },
  cyan: { dot: "bg-cyan-500", activeBg: "bg-cyan-50", activeText: "text-cyan-700", border: "border-cyan-500" },
  orange: { dot: "bg-orange-500", activeBg: "bg-orange-50", activeText: "text-orange-700", border: "border-orange-500" },
  fuchsia: { dot: "bg-fuchsia-500", activeBg: "bg-fuchsia-50", activeText: "text-fuchsia-700", border: "border-fuchsia-500" },
  sky: { dot: "bg-sky-500", activeBg: "bg-sky-50", activeText: "text-sky-700", border: "border-sky-500" },
  slate: { dot: "bg-slate-500", activeBg: "bg-slate-100", activeText: "text-slate-700", border: "border-slate-400" },
};

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white print:hidden">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          N
        </div>
        <span className="text-base font-semibold tracking-tight text-slate-900">Nexora ERP</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {PINNED_LINKS.map((link) => {
            const Icon = PINNED_ICONS[link.href] ?? HomeIcon;
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-4 border-t border-slate-100" />

        <div className="space-y-1">
          {NAV_GROUPS.map((group) => {
            const colors = COLOR_CLASSES[group.color];
            const groupActive = group.links.some((l) => isActive(pathname, l.href));
            return (
              <details key={group.label} open={groupActive} className="group/section">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-50">
                  <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                  <span className="flex-1">{group.label}</span>
                  <ChevronIcon className="h-3.5 w-3.5 text-slate-400 transition-transform group-open/section:rotate-90" />
                </summary>
                <ul className="mt-0.5 space-y-0.5 pb-1">
                  {group.links.map((link) => {
                    const active = isActive(pathname, link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={`ml-3 flex items-center gap-2 rounded-lg border-l-2 py-1.5 pl-3 pr-2 text-sm transition-colors ${
                            active
                              ? `${colors.activeBg} ${colors.activeText} ${colors.border} font-medium`
                              : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
        </div>

        <div className="my-4 border-t border-slate-100" />

        <ul className="space-y-0.5">
          {FOOTER_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            const Icon = link.href === "/users" ? UsersIcon : SettingsIcon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
