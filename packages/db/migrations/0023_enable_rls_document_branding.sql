-- document_branding gets the same RLS backstop as 0001_enable_rls.sql.
-- tenant_id is this table's primary key, not a separate id column.

ALTER TABLE "document_branding" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "document_branding"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
