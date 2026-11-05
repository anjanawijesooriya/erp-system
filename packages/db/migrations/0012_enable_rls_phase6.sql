-- Phase 6 tenant-scoped tables get the same RLS backstop as 0001_enable_rls.sql.
-- See that file for the full explanation and the non-owner-role caveat.

ALTER TABLE "journal_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounting_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cheques" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bank_reconciliations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "journal_entries"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "accounting_periods"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "cheques"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "bank_reconciliations"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- journal_entry_lines and bank_reconciliation_items have no direct
-- tenant_id column; they're scoped transitively through their parent
-- header table (same pattern as role_permissions/user_roles in 0001).
