/**
 * Canonical permission catalogue. Keys are dot-namespaced:
 * `<module>.<resource>.<action>`. Add new permissions here first, then
 * reference the key from a route/server-action guard — never invent a key
 * inline at the call site.
 */
export const PERMISSIONS = {
  // Tenant & user administration
  TENANT_SETTINGS_MANAGE: "tenant.settings.manage",
  USER_MANAGE: "tenant.users.manage",
  ROLE_MANAGE: "tenant.roles.manage",
  AUDIT_LOG_VIEW: "tenant.audit_log.view",

  // Master data (Phase 2, declared now so roles can reference them)
  PRODUCT_MANAGE: "catalog.product.manage",
  PRODUCT_COST_PRICE_VIEW: "catalog.cost_price.view",
  CUSTOMER_MANAGE: "catalog.customer.manage",
  SUPPLIER_MANAGE: "catalog.supplier.manage",

  // Inventory
  WAREHOUSE_MANAGE: "inventory.warehouse.manage",
  STOCK_VIEW: "inventory.stock.view",
  STOCK_ADJUST: "inventory.stock.adjust",
  STOCK_TRANSFER: "inventory.stock.transfer",
  STOCK_COUNT_MANAGE: "inventory.stock_count.manage",

  // Purchasing
  PURCHASE_ORDER_CREATE: "purchasing.order.create",
  GRN_CREATE: "purchasing.grn.create",
  SUPPLIER_INVOICE_CREATE: "purchasing.invoice.create",
  SUPPLIER_PAYMENT_CREATE: "purchasing.payment.create",
  PURCHASE_RETURN_CREATE: "purchasing.return.create",
  PAYABLES_VIEW: "purchasing.payables.view",

  // Sales
  QUOTATION_CREATE: "sales.quotation.create",
  SALES_ORDER_CREATE: "sales.order.create",
  SALES_INVOICE_CREATE: "sales.invoice.create",
  SALES_INVOICE_VOID: "sales.invoice.void",
  DELIVERY_CREATE: "sales.delivery.create",
  SALES_PAYMENT_CREATE: "sales.payment.create",
  SALES_RETURN_CREATE: "sales.return.create",
  RECEIVABLES_VIEW: "sales.receivables.view",
  POS_SELL: "sales.pos.sell",

  // Accounting — the sensitive one per the build plan: only accountants post journals
  JOURNAL_POST: "accounting.journal.post",
  JOURNAL_VIEW: "accounting.journal.view",
  PERIOD_CLOSE: "accounting.period.close",
  REPORTS_FINANCIAL_VIEW: "accounting.reports.view",
  CHEQUE_MANAGE: "accounting.cheque.manage",
  BANK_RECONCILIATION_MANAGE: "accounting.bank_reconciliation.manage",

  // Reports and dashboards
  REPORTS_VIEW: "reports.operational.view",

  // Phase 8 — pilot support: opening-balance go-live import, weekly
  // reconciliation, in-app issue tracking
  OPENING_BALANCE_IMPORT: "pilot.opening_balance.import",
  RECONCILIATION_MANAGE: "pilot.reconciliation.manage",
  ISSUE_REPORT: "pilot.issue.report",
  ISSUE_MANAGE: "pilot.issue.manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: readonly PermissionKey[] = Object.values(PERMISSIONS);
