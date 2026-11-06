export interface NavLink {
  href: string;
  label: string;
}

export interface NavGroup {
  label: string;
  /** A color key from the accent cycle in sidebar.tsx — keeps each section visually distinct at a glance. */
  color: "brand" | "accent" | "amber" | "rose" | "violet" | "cyan" | "orange" | "fuchsia" | "sky" | "slate";
  links: NavLink[];
}

/** Pinned items shown above every group, not inside a collapsible section. */
export const PINNED_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pos", label: "POS" },
  { href: "/reports", label: "Reports" },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Master data",
    color: "slate",
    links: [
      { href: "/products", label: "Products" },
      { href: "/customers", label: "Customers" },
      { href: "/suppliers", label: "Suppliers" },
      { href: "/accounts", label: "Chart of Accounts" },
    ],
  },
  {
    label: "Inventory",
    color: "cyan",
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
    color: "orange",
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
    color: "accent",
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
    color: "violet",
    links: [
      { href: "/accounting/expenses", label: "Expenses" },
      { href: "/accounting/journal", label: "Journal" },
      { href: "/accounting/reports", label: "Reports" },
      { href: "/accounting/periods", label: "Periods" },
      { href: "/accounting/cheques", label: "Cheques" },
      { href: "/accounting/bank-reconciliation", label: "Bank Reconciliation" },
    ],
  },
  {
    label: "HR",
    color: "rose",
    links: [
      { href: "/hr/employees", label: "Employees" },
      { href: "/hr/payroll", label: "Payroll" },
    ],
  },
  {
    label: "Manufacturing",
    color: "amber",
    links: [
      { href: "/manufacturing/bom", label: "Bills of Materials" },
      { href: "/manufacturing/production", label: "Production Orders" },
    ],
  },
  {
    label: "E-commerce",
    color: "fuchsia",
    links: [{ href: "/ecommerce/channels", label: "Sales Channels" }],
  },
  {
    label: "Pilot",
    color: "sky",
    links: [
      { href: "/pilot/opening-balances", label: "Opening Balances" },
      { href: "/pilot/reconciliation", label: "Weekly Reconciliation" },
      { href: "/pilot/issues", label: "Issues" },
    ],
  },
];

/** Not inside a group — rendered as a plain pinned link alongside Users/Settings in the sidebar footer area. */
export const FOOTER_LINKS: NavLink[] = [
  { href: "/users", label: "Users" },
  { href: "/settings", label: "Settings" },
  { href: "/settings/invoice-branding", label: "Invoice Branding" },
  { href: "/settings/accountants", label: "Linked Accountants" },
];
