"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FOOTER_LINKS, NAV_GROUPS, PINNED_LINKS, type NavGroup } from "./app-nav";
import {
  BuildingIcon,
  CartIcon,
  ChartIcon,
  ChevronIcon,
  CogIcon,
  HomeIcon,
  MenuIcon,
  PackageIcon,
  SettingsIcon,
  StoreIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from "./icons";

const PINNED_ICONS: Record<string, (props: { className?: string }) => React.ReactElement> = {
  "/dashboard": HomeIcon,
  "/pos": CartIcon,
  "/reports": ChartIcon,
};

const GROUP_ICONS: Record<string, (props: { className?: string }) => React.ReactElement> = {
  "Master data": BuildingIcon,
  Inventory: PackageIcon,
  Purchasing: TruckIcon,
  Sales: StoreIcon,
  Accounting: WalletIcon,
  HR: UsersIcon,
  Manufacturing: CogIcon,
  "E-commerce": CartIcon,
  Pilot: ChartIcon,
};

const COLOR_CLASSES: Record<NavGroup["color"], { dot: string; activeBg: string; activeText: string; border: string; iconBg: string; iconText: string }> = {
  brand: { dot: "bg-brand-500", activeBg: "bg-brand-50", activeText: "text-brand-700", border: "border-brand-500", iconBg: "bg-brand-100", iconText: "text-brand-600" },
  accent: { dot: "bg-accent-500", activeBg: "bg-accent-50", activeText: "text-accent-700", border: "border-accent-500", iconBg: "bg-accent-100", iconText: "text-accent-600" },
  amber: { dot: "bg-amber-500", activeBg: "bg-amber-50", activeText: "text-amber-700", border: "border-amber-500", iconBg: "bg-amber-100", iconText: "text-amber-600" },
  rose: { dot: "bg-rose-500", activeBg: "bg-rose-50", activeText: "text-rose-700", border: "border-rose-500", iconBg: "bg-rose-100", iconText: "text-rose-600" },
  violet: { dot: "bg-violet-500", activeBg: "bg-violet-50", activeText: "text-violet-700", border: "border-violet-500", iconBg: "bg-violet-100", iconText: "text-violet-600" },
  cyan: { dot: "bg-cyan-500", activeBg: "bg-cyan-50", activeText: "text-cyan-700", border: "border-cyan-500", iconBg: "bg-cyan-100", iconText: "text-cyan-600" },
  orange: { dot: "bg-orange-500", activeBg: "bg-orange-50", activeText: "text-orange-700", border: "border-orange-500", iconBg: "bg-orange-100", iconText: "text-orange-600" },
  fuchsia: { dot: "bg-fuchsia-500", activeBg: "bg-fuchsia-50", activeText: "text-fuchsia-700", border: "border-fuchsia-500", iconBg: "bg-fuchsia-100", iconText: "text-fuchsia-600" },
  sky: { dot: "bg-sky-500", activeBg: "bg-sky-50", activeText: "text-sky-700", border: "border-sky-500", iconBg: "bg-sky-100", iconText: "text-sky-600" },
  slate: { dot: "bg-slate-500", activeBg: "bg-slate-100", activeText: "text-slate-700", border: "border-slate-400", iconBg: "bg-slate-200", iconText: "text-slate-600" },
};

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

const COLLAPSE_KEY = "erp-sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // ignore (private browsing / storage disabled)
    }
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 print:hidden ${
        collapsed ? "w-[68px]" : "w-64"
      } ${hydrated ? "" : "invisible"}`}
    >
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-200 px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">
          N
        </div>
        {!collapsed && <span className="text-base font-semibold tracking-tight text-slate-900">Nexora ERP</span>}
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
                  title={collapsed ? link.label : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-4 border-t border-slate-100" />

        <div className="space-y-1">
          {NAV_GROUPS.map((group) => {
            const colors = COLOR_CLASSES[group.color];
            const GroupIcon = GROUP_ICONS[group.label] ?? HomeIcon;
            const groupActive = group.links.some((l) => isActive(pathname, l.href));

            if (collapsed) {
              return (
                <div key={group.label} className="group relative">
                  <Link
                    href={group.links[0]?.href ?? "#"}
                    title={group.label}
                    className={`flex items-center justify-center rounded-lg p-2.5 transition-colors ${
                      groupActive ? `${colors.iconBg} ${colors.iconText}` : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <GroupIcon className="h-4 w-4" />
                  </Link>
                </div>
              );
            }

            return (
              <details key={group.label} open={groupActive} className="group/section">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-50">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-md ${colors.iconBg} ${colors.iconText}`}>
                    <GroupIcon className="h-3 w-3" />
                  </span>
                  <span className="flex-1 normal-case tracking-normal text-[13px]">{group.label}</span>
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
                  title={collapsed ? link.label : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        type="button"
        onClick={toggleCollapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="flex h-11 shrink-0 items-center justify-center gap-2 border-t border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
      >
        <MenuIcon className="h-4 w-4" />
        {!collapsed && <span className="text-xs font-medium">Collapse</span>}
      </button>
    </aside>
  );
}
