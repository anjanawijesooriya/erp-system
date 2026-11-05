-- Phase 5 tenant-scoped tables get the same RLS backstop as 0001_enable_rls.sql.
-- See that file for the full explanation and the non-owner-role caveat.

ALTER TABLE "quotations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales_invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deliveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales_returns" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "quotations"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "sales_orders"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "sales_invoices"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "deliveries"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "sales_payments"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "sales_returns"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- quotation_lines, sales_order_lines, sales_invoice_lines, delivery_lines,
-- sales_payment_allocations and sales_return_lines have no direct
-- tenant_id column; they're scoped transitively through their parent
-- header table (same pattern as role_permissions/user_roles in 0001).
