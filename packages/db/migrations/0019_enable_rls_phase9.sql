-- Phase 9 tenant-scoped tables get the same RLS backstop as 0001_enable_rls.sql.
-- See that file for the full explanation and the non-owner-role caveat.
-- Child tables with no tenant_id column of their own (payroll_run_lines,
-- bill_of_material_lines, channel_product_links) rely on their parent's
-- policy, same as journal_entry_lines etc. in earlier phases.

ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bill_of_materials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "production_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales_channels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "channel_orders" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "employees"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "payroll_runs"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "bill_of_materials"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "production_orders"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "sales_channels"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "channel_orders"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
