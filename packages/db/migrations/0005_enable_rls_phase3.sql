-- Phase 3 tenant-scoped tables get the same RLS backstop as 0001_enable_rls.sql.
-- See that file for the full explanation and the non-owner-role caveat.

ALTER TABLE "warehouses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_reorder_levels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_adjustments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_counts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "warehouses"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "stock_movements"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "stock_balances"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "product_reorder_levels"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "stock_transfers"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "stock_adjustments"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "stock_counts"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- stock_transfer_lines, stock_adjustment_lines and stock_count_lines have no
-- direct tenant_id column; they're scoped transitively through their parent
-- header table (same pattern as role_permissions/user_roles in 0001).
