-- Phase 8 tenant-scoped tables get the same RLS backstop as 0001_enable_rls.sql.
-- See that file for the full explanation and the non-owner-role caveat.

ALTER TABLE "pilot_reconciliation_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pilot_issues" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "pilot_reconciliation_entries"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "pilot_issues"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
