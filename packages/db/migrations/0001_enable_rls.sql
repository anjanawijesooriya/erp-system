-- Row-Level Security backstop for tenant scoping (build-plan rule: "one
-- missed where clause on financial data is a serious incident").
--
-- The app sets `app.current_tenant_id` once per request/transaction via
-- `SET LOCAL app.current_tenant_id = '<tenant uuid>'` before running any
-- query (see packages/db — TODO: add a `withTenant` transaction helper that
-- does this automatically). Every tenant-scoped query must still filter by
-- tenantId at the application level too; RLS is the backstop, not the
-- primary control.
--
-- IMPORTANT: RLS is bypassed for the table owner. The role the app
-- connects as (DATABASE_URL) must NOT be the role that owns these tables.
-- In local dev with the default `erp` user this policy has no effect
-- until a separate, non-owner `erp_app` role is created and granted
-- SELECT/INSERT/UPDATE/DELETE — tracked as a follow-up before this goes
-- anywhere near production data.

ALTER TABLE "branches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "doc_number_sequences" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "branches"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "users"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- roles.tenant_id is nullable: null means a system role visible to every tenant.
CREATE POLICY tenant_isolation ON "roles"
  USING (
    tenant_id IS NULL
    OR tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

CREATE POLICY tenant_isolation ON "audit_logs"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "subscriptions"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "doc_number_sequences"
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- role_permissions and user_roles have no direct tenant_id column; they are
-- scoped transitively through roles/users, which already carry the policy
-- above. Leave them without RLS of their own rather than adding a fragile
-- join-based policy — enforcement there goes through packages/core's
-- can()/assertCan() instead.
