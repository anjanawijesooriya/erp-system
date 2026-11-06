-- cash_register_sessions gets the same RLS backstop as 0001_enable_rls.sql.

ALTER TABLE "cash_register_sessions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "cash_register_sessions"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
