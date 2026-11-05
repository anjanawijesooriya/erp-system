import Link from "next/link";

const groups: { label: string; links: { href: string; label: string }[] }[] = [
  {
    label: "",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/pos", label: "POS" },
      { href: "/reports", label: "Reports" },
      { href: "/users", label: "Users" },
      { href: "/settings", label: "Settings" },
    ],
  },
  {
    label: "Master data",
    links: [
      { href: "/products", label: "Products" },
      { href: "/customers", label: "Customers" },
      { href: "/suppliers", label: "Suppliers" },
      { href: "/accounts", label: "Chart of Accounts" },
    ],
  },
  {
    label: "Inventory",
    links: [
      { href: "/warehouses", label: "Warehouses" },
      { href: "/inventory", label: "Stock" },
      { href: "/inventory/transfers", label: "Transfers" },
      { href: "/inventory/adjustments", label: "Adjustments" },
      { href: "/inventory/counts", label: "Stock Counts" },
    ],
  },
  {
    label: "Purchasing",
    links: [
      { href: "/purchasing/orders", label: "Purchase Orders" },
      { href: "/purchasing/grn", label: "GRN" },
      { href: "/purchasing/invoices", label: "Supplier Invoices" },
      { href: "/purchasing/payments", label: "Supplier Payments" },
      { href: "/purchasing/returns", label: "Purchase Returns" },
      { href: "/purchasing/payables", label: "Payables Aging" },
    ],
  },
  {
    label: "Sales",
    links: [
      { href: "/sales/quotations", label: "Quotations" },
      { href: "/sales/orders", label: "Sales Orders" },
      { href: "/sales/invoices", label: "Sales Invoices" },
      { href: "/sales/deliveries", label: "Deliveries" },
      { href: "/sales/payments", label: "Receipts" },
      { href: "/sales/returns", label: "Sales Returns" },
      { href: "/sales/receivables", label: "Receivables Aging" },
    ],
  },
  {
    label: "Accounting",
    links: [
      { href: "/accounting/journal", label: "Journal" },
      { href: "/accounting/reports", label: "Reports" },
      { href: "/accounting/periods", label: "Periods" },
      { href: "/accounting/cheques", label: "Cheques" },
      { href: "/accounting/bank-reconciliation", label: "Bank Reconciliation" },
    ],
  },
  {
    label: "Pilot",
    links: [
      { href: "/pilot/opening-balances", label: "Opening Balances" },
      { href: "/pilot/reconciliation", label: "Weekly Reconciliation" },
      { href: "/pilot/issues", label: "Issues" },
    ],
  },
];

export function AppNav() {
  return (
    <nav className="mb-6 space-y-2 border-b border-slate-200 pb-3 text-sm">
      {groups.map((group) => (
        <div key={group.label || "top"} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {group.label && (
            <span className="w-24 shrink-0 text-xs font-medium uppercase text-slate-400">{group.label}</span>
          )}
          {group.links.map((link) => (
            <Link key={link.href} href={link.href} className="text-slate-600 hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
