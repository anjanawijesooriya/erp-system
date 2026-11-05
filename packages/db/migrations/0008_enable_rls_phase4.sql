-- Phase 4 tenant-scoped tables get the same RLS backstop as 0001_enable_rls.sql.
-- See that file for the full explanation and the non-owner-role caveat.

ALTER TABLE "purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "goods_receipt_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplier_invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplier_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_returns" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "purchase_orders"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "goods_receipt_notes"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "supplier_invoices"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "supplier_payments"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "purchase_returns"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- purchase_order_lines, goods_receipt_note_lines, supplier_invoice_lines,
-- supplier_payment_allocations and purchase_return_lines have no direct
-- tenant_id column; they're scoped transitively through their parent
-- header table (same pattern as role_permissions/user_roles in 0001).
