# ERP Platform for Local Shops

Phase 1 foundation (monorepo, tenants/branches, users, RBAC, audit log, auth),
Phase 2 master data (products/variants/UoM, customers/suppliers, chart of
accounts, Excel import), Phase 3 inventory (warehouses, the stock movement
ledger, transfers, adjustments, stock counts, reorder levels), Phase 4
purchasing (PO → GRN → supplier invoice → payment, purchase returns,
payables aging), Phase 5 sales (quotation → sales order → invoice →
delivery → payment, sales returns, receivables aging, POS) and Phase 6
accounting (automatic double-entry posting from every module, manual
journals, cheque/PDC tracking, bank reconciliation, trial balance, P&L,
balance sheet, period locking), Phase 7 reports/dashboards (sales,
margin, stock valuation, dead stock, top customers/products, daily owner
SMS summary via Notify.lk), and the SaaS-platform items from the doc's
"SaaS and multi-tenancy" / "Operational SaaS needs" sections (self-service
signup wizard, plan tiers with feature gating and limits, a super-admin
panel, per-tenant data export) are done. See
`ERP Platform for Local Shops — Tech Stack & Build Plan.md` for the full plan.

## Structure

- `apps/web` — Next.js app (App Router), NextAuth credentials login, RBAC-protected pages for
  products, customers, suppliers, chart of accounts, warehouses, inventory, purchasing, sales,
  a POS checkout terminal, accounting (journal, reports, periods, cheques, bank reconciliation),
  an operational reports dashboard, settings, a public signup wizard, and a separately-authenticated
  super-admin panel.
- `apps/worker` — BullMQ worker for background jobs: a `maintenance` queue (wiring proof-of-concept)
  and `daily-summary` (the Phase 7 owner SMS job, scheduled for 8pm daily; payroll etc. — later phases).
- `packages/db` — Drizzle schema, migrations, DB client.
- `packages/core` — business rules: RBAC permission catalogue, doc-number sequences, audit log
  writer, catalog/parties/accounting/inventory/purchasing/sales/reports/plans/tenants/platform-admin
  services, Excel import, seed script.
- `packages/ui` — shared UI components and Tailwind preset.
- `packages/config` — shared tsconfig base.

## First-time setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Start Postgres + Redis**
   ```
   docker compose up -d
   ```
   This maps Postgres to host port `55432` and Redis to `16379` instead of
   their usual ports — on a machine that already runs a native Postgres/Redis
   on 5432/6379, publishing straight to those ports causes requests to
   randomly hit the wrong server (e.g. a confusing "password authentication
   failed" even with correct container credentials). Adjust the port numbers
   in `docker-compose.yml` and every `.env*` file together if you change them.

3. **Environment files**
   ```
   cp .env.example .env
   cp apps/web/.env.example apps/web/.env.local
   ```
   Generate a real `AUTH_SECRET` for `apps/web/.env.local`:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. **Run migrations**
   ```
   npm run db:migrate
   ```

5. **Seed demo data**
   ```
   npm run db:seed
   ```
   Creates tenant "Demo Hardware Shop", a Head Office branch, the four system
   roles (Owner/Accountant/BranchManager/Cashier), and an Owner login:
   `owner@demo.shop` / `ChangeMe123!`.

6. **Run the app**
   ```
   npm run dev
   ```
   Web app: http://localhost:3000 — log in with shop `demo-hardware`,
   `owner@demo.shop` / `ChangeMe123!`. Then visit `/products`, `/customers`,
   `/suppliers`, `/accounts`, `/warehouses`, `/inventory`,
   `/purchasing/{orders,grn,invoices,payments,returns,payables}`, `/pos`,
   `/sales/{quotations,orders,invoices,deliveries,payments,returns,receivables}`
   `/accounting/{journal,reports,periods,cheques,bank-reconciliation}`,
   `/reports` and `/settings`. Public signup wizard at `/signup`. Super-admin
   panel at `/admin` — separately authenticated, see "Platform admin" below.

## Important: Next.js dev mode and the DB connection pool

`packages/db/src/client.ts` caches its Postgres connection pool on
`globalThis` specifically because Next.js dev mode re-executes module
top-level code on every hot reload — without the cache, each reload opened
a *new* pool that was never closed, and a long dev session eventually hit
Postgres's `max_connections` ("sorry, too many clients already"), which
briefly broke login mid-way through Phase 5 development. If you ever hit
that error again: check for **duplicate `next dev` / worker processes**
left running from a previous session first (`docker exec <postgres
container> psql -U erp -d erp -c "select count(*) from pg_stat_activity;"`
to see the connection count) — that's more likely than the pool-caching
fix regressing. `docker compose restart postgres` clears stuck connections
without losing data.

## Platform admin & SaaS platform notes

- **Platform admin is a separate login from tenant users** — not a row in
  `users` (which always requires a `tenantId`), but its own `platform_admins`
  table, authenticated via a hand-rolled HMAC-signed cookie
  (`apps/web/lib/admin-session.ts`), not NextAuth. A bootstrap admin exists:
  `admin@platform.local` / `AdminPass123!` — change or remove this before
  any real deployment; `createPlatformAdmin()` in
  `packages/core/src/platform-admin/admins.ts` is bootstrap-only, there's no
  self-service signup for platform admins by design.
- **"Support impersonation" is simplified**, not full session-swapping: the
  admin panel's "Log view" button writes an audit log entry
  (`logAdminTenantAccess`) rather than forging a real tenant user session.
  Safely forging a NextAuth session for an arbitrary tenant user is a
  larger, security-sensitive piece intentionally left as a follow-up rather
  than built half-right under time pressure.
- **Plan tiers** (`packages/core/src/plans/plan-tiers.ts`) match the build
  plan's table exactly: POS (sales + POS only, 1 branch/3 users/200
  products), Business (+ inventory + purchasing, 5/15/2000), ERP
  (+ accounting + payroll, unlimited). `subscriptions.plan` is a real
  Postgres enum now (`plan_tier`), not free text.
- **Feature gating is applied to all 16 plan-sensitive pages**
  (`<ModuleGate>` in `components/module-gate.tsx`): all 5 `/accounting/*`
  pages (ERP tier), all 6 `/purchasing/*` pages and all 5
  inventory-related pages (`/warehouses`, `/inventory`,
  `/inventory/transfers`, `/inventory/adjustments`, `/inventory/counts` —
  Business tier). Verified live end-to-end through a real login: a fresh
  POS-tier tenant correctly gets the "Not included in your plan" message
  on both Purchasing and Inventory pages; the demo ERP-tier tenant sees
  all of them normally.
- **Plan limits are enforced at creation time** via `assertWithinLimit` —
  wired into `createProduct` (maxProducts), `createBranch` (maxBranches),
  and `inviteUser` (maxUsers — see `/users`, the user invite/management
  page this round added since nothing could create a user other than
  onboarding or the seed script before). Verified live: a fresh POS-tier
  tenant (limit 3) correctly accepted 2 invited users (3 total with the
  owner), correctly rejected a 4th, and correctly allowed a 4th after
  upgrading to Business. Also confirmed the owner→role→branch relational
  query on `/users` renders correctly — this required adding `relations()`
  definitions for `roles`/`rolePermissions`/`userRoles` that had never
  existed (the RBAC schema had zero Drizzle relations since Phase 1, only
  ever queried with manual joins before now).
- The self-service signup wizard (`onboardTenant` in
  `packages/core/src/tenants/onboarding.ts`) creates the tenant, Head
  Office branch, a trialing POS-tier subscription, all 4 system roles, the
  chart of accounts for the chosen business type, and the owner's login —
  **genuinely atomic now**: `seedSystemRolesForTenant`, `seedChartOfAccounts`
  and `createSubscription` were refactored to accept an optional `tx`
  parameter so they actually participate in the onboarding transaction
  (they used to always use the global `db`, which — despite being called
  from inside `db.transaction(...)` — silently ran as separate, immediately
  committed statements outside it; a real atomicity bug caught and fixed
  this round, not just a hypothetical one).
- Per-tenant data export (`exportTenantData`, `/api/export-data`, linked
  from `/settings`) is a JSON snapshot of master data and transaction
  headlines (no line items, movements or journal lines) — enough for a
  GDPR-style "take your data" request, not a full relational dump.

### A second duplicate-constraint bug, same class as the Phase 3 roles bug

**`branches` had no unique constraint on `(tenant_id, code)`.** Every
`npm run db:seed` re-run across every phase of this build (8+ times)
silently inserted a duplicate "Head Office" branch for the demo tenant,
because `.onConflictDoNothing()` had no real constraint to conflict
against — exactly the same root cause as the roles-table bug from Phase 3.
It went undetected for 7 phases because nothing surfaced a branch *count*
anywhere until the new super-admin panel's usage column showed **10**
Head Office branches for one tenant. Fixed the same way as the roles bug:
added `uniqueIndex("branches_tenant_code_idx")` (migration
`0015_serious_agent_brand.sql`), deduped the 9 extra rows in the dev DB
(verified first that nothing referenced them — `warehouses`,
`doc_number_sequences`, `journal_entries`, `quotations`, `purchase_orders`
all showed 0 rows for the duplicates, so a plain `DELETE` was safe with no
FK repointing needed), and confirmed re-running the seed is now idempotent
(exactly 1 branch afterward). **Lesson for future schema work**: any table
with a natural per-tenant "slug"/"code" uniquely identifying a record
(roles.name, branches.code, products.sku, etc.) needs its unique index
added in the *same* migration as the table itself — a few of these have
now slipped through and only been caught by a usage count or a direct
`.onConflictDoNothing()` bug symptom, not systematically checked for.

## Phase 7 notes

- **Notify.lk SMS was never actually tested against the live API** — this
  repo has no real Notify.lk credentials. `apps/worker/src/notifylk.ts`'s
  `sendSms` checks for `NOTIFYLK_USER_ID`/`NOTIFYLK_API_KEY` and logs +
  no-ops instead of throwing when they're missing, so the daily-summary
  job still runs and computes the summary correctly — it just doesn't
  send anything. Set those env vars (plus optionally `NOTIFYLK_SENDER_ID`)
  on the worker process to actually send. Set a tenant's SMS recipient at
  `/settings` (`tenants.ownerPhone`, E.164 format) — a tenant with no
  phone set is silently skipped by `listTenantsWithSmsEnabled`.
- The daily-summary job is scheduled via BullMQ's repeat option (8pm
  server time, cron `0 20 * * *`) in `apps/worker/src/queues/daily-summary.ts`,
  registered once at worker startup — confirmed live that the worker
  picks this up and registers both queues without errors even with no
  Notify.lk credentials configured.
- The margin report (`packages/core/src/reports/margin.ts`) is a
  **per-product aggregate for the period**, not a per-transaction one:
  revenue comes from `sales_invoice_lines` (billing), COGS comes from
  `stock_movements` where `movementType = 'sales'` (the delivery event) in
  the same date range. Since an invoice and its delivery can land on
  different days, these aren't joined transaction-by-transaction — don't
  expect a single invoice's margin to reconcile exactly against this
  report; it's correct in aggregate over a range, which is what a margin
  report is normally used for anyway.
- Dead stock (`dead-stock.ts`) flags anything with stock on hand that has
  had no `"sales"` movement within the lookback window — verified
  correctly empty for a product sold within the window, and verified
  non-empty results are stable (a degenerate 0-day test window initially
  looked like a bug — it wasn't; nothing can be "sold within the last 0
  elapsed days").
- Verified against the live DB: GRN → sales invoice → delivery, then
  confirmed `getSalesByDay`, `getTopProducts`, `getTopCustomers` (all
  showed the correct 800.00 revenue / 10 qty), `getMarginByProduct`
  (correctly computed 37.5% margin: revenue 800, COGS 500, margin 300),
  `getStockValuation` (correctly totaled 4500.00 for 90 remaining units at
  cost 50), and `computeDailySummary`/`formatSummarySms` (produced a
  correctly formatted summary string) all in one chain.

## Phase 6 notes

- `packages/core/src/accounting/journal.ts`'s `postJournalEntry` is the
  single writer to the double-entry ledger (`journal_entries`/
  `journal_entry_lines`) — it validates every line has exactly one of
  debit/credit set, that the entry balances, and that the entry date isn't
  inside a closed accounting period, before writing anything. Both the
  manual journal UI and every module's auto-posting
  (`packages/core/src/accounting/auto-posting.ts`) go through it; there is
  no other way to create a journal entry.
- Auto-posting wiring, one pair per document type: GRN debits Inventory
  and credits a new **GRN Clearing** account (1250) rather than Accounts
  Payable directly — the matching supplier invoice is what converts that
  clearing balance into a real payable (debits 1250, credits AP), *unless*
  the invoice has no `grnId` (entered standalone), in which case it debits
  Inventory directly instead. Deliveries recognize COGS (debit COGS,
  credit Inventory) at the warehouse's weighted-average cost — this is a
  deliberate consequence of Phase 5's "invoice bills, delivery moves
  stock" split, which turned out to map cleanly onto accrual accounting.
  Sales/purchase returns post two balanced sub-postings in one entry
  (inventory + COGS reversal, and AR/AP + the return's credit value).
  Payments by cheque route through **Post-Dated Cheques Receivable**
  (1300) or **Post-Dated Cheques Payable** (2200) instead of Cash/Bank,
  since a cheque hasn't actually cleared yet — see `cheques.ts` for what
  happens when it does (or bounces).
- The PDC accounts (1300, 2200) and GRN Clearing (1250) moved into the
  **base** chart-of-accounts template in Phase 6 — they used to be
  wholesale-business-type-only extras from Phase 2, but Phase 6 gives
  every business type cheque tracking and the GRN/invoice split, so every
  tenant needs them now regardless of business type.
- There's no period-close entry that rolls P&L into Retained Earnings —
  `closePeriod` only locks the period against new postings. The balance
  sheet instead surfaces cumulative net income as its own
  `unclosedNetIncome` line so assets still equal liabilities + equity +
  that line; a real "close the year" workflow that actually posts a
  closing entry is a natural follow-up.
- Verified against the live DB in one continuous chain: GRN (debit
  Inventory 40000 / credit GRN Clearing 40000) → standalone supplier
  invoice with no GRN link (debit Inventory 40000 / credit AP 40000) →
  supplier payment by bank (debit AP / credit Bank 40000) → sales invoice
  (debit AR / credit Sales Revenue 17500) → delivery (debit COGS / credit
  Inventory at WAC) → sales payment by cash (debit Cash / credit AR
  17500) — confirmed **debits exactly equal credits across all 6 entries
  combined (165000 = 165000)**, confirmed the P&L correctly computed net
  profit 7500 (17500 revenue − 10000 COGS), and confirmed the balance
  sheet balances exactly (assets 7500 = liabilities 0 + equity 0 +
  unclosed net income 7500). Also verified separately: an issued cheque
  correctly posts on clearing, a manual journal entry and its reversal
  both post correctly (debit/credit swapped, linked via
  `reversalOfEntryId`), posting into a closed period is correctly
  rejected (`PeriodClosedError`), and bank reconciliation correctly
  computed a cleared balance matching the statement balance with zero
  variance.

## Phase 5 notes

- Mirrors Phase 4's structure exactly: quotations/sales orders are
  non-binding/non-posting (status open/closed/cancelled, no stock or
  accounting impact), a sales invoice bills the customer but — like a
  supplier invoice — does **not** move stock, and a delivery is the actual
  stock-moving event (`postMovement` with movementType `"sales"`), costed
  at the warehouse's current weighted-average cost regardless of the
  invoice's selling price. Receivables aging (`listReceivablesAging`) is a
  line-for-line mirror of Phase 4's payables aging, sharing a bucketing
  helper in `packages/core/src/aging.ts`.
- POS (`packages/core/src/sales/pos.ts`, `/pos`) is the odd one out: it
  bundles invoice + delivery + payment into a single transaction, marks the
  invoice paid immediately, and doesn't require a named customer — an
  unselected customer is attributed to a synthetic per-tenant "Walk-in
  Customer" record (`getOrCreateWalkInCustomer` in
  `packages/core/src/parties/customers.ts`) rather than making
  `customerId` nullable across five tables.
- Sales returns credit the customer but are **not** automatically netted
  against outstanding invoices in the receivables aging report — same
  documented simplification as Phase 4's purchase returns not netting
  against payables. A return is its own document; applying it to reduce a
  specific invoice's balance would need an explicit step this MVP doesn't
  have yet.
- Verified against the live DB in one continuous chain: GRN stocked 50
  units @ cost 1000 → quotation → sales order → invoice (5 units @ 1500,
  confirmed total 7500 and 30-day due date from the customer's credit
  terms) → delivery (confirmed stock dropped to 45 **at cost 1000, not the
  1500 selling price**) → return of 1 unit → a 3000 payment (confirmed
  4500 remaining, correctly bucketed "current") → a POS sale with no
  customer selected (confirmed it created its own `paid` invoice and
  attributed to "Walk-in Customer") → final stock exactly matched the
  expected running total (45 + 1 − 2 = 44).

## Phase 4 notes

- Document numbers (`PO-HO-000001`, `GRN-HO-000001`, `SINV-HO-000001`,
  `SPAY-HO-000001`, `PRET-HO-000001`) use `nextDocNumber()` from
  `packages/core/src/doc-numbers.ts` — written in Phase 1, this is the
  first phase that actually exercises it, and it's gapless per tenant +
  branch + doc type as build-plan rule #5 requires.
- GRN is the first real caller of `postMovement` with a genuine purchase
  cost — everything in Phase 3 (transfers, adjustments, stock counts) only
  ever moved or corrected an *existing* average cost. Posting a GRN is what
  actually establishes a warehouse's weighted-average cost for a product
  the first time stock comes in.
- A purchase order has no required link to a GRN, and a GRN has no required
  link to a PO — both are optional for flexibility (e.g. receiving goods
  without first raising a PO). There's no automatic PO status rollup
  (partially/fully received) from GRN quantities yet; `closePurchaseOrder`
  is a manual action.
- Supplier invoice due dates are computed automatically from
  `suppliers.creditTermDays` at the time the invoice is created — the credit
  terms captured in Phase 2 finally get used here.
- Supplier payments allocate FIFO (oldest due date first) across a
  supplier's outstanding invoices and update each invoice's status as it's
  paid off. There's no supplier credit-balance concept — an overpayment
  beyond total outstanding is just not allocated anywhere (documented
  limitation, same spirit as the stock-count MVP simplification in Phase 3).
- Payables aging buckets each outstanding invoice individually by days past
  its due date (current / 1-30 / 31-60 / 61-90 / 90+), not by supplier in
  aggregate — matches how a real aging report is normally read.

## Phase 3 notes

- The stock ledger (`stock_movements`) is append-only — there is no editable
  quantity field anywhere. `stock_balances` is a materialized running total
  per (warehouse, variant, batch) kept in sync in the same transaction as
  each movement, purely for read performance; it's always re-derivable by
  replaying `stock_movements` and must never be treated as a second source
  of truth. See `packages/core/src/inventory/movements.ts`'s `postMovement`
  — it's the single writer to both tables.
- Weighted-average costing: an inbound movement rolls the average cost
  forward; an outbound movement (including a transfer's outbound leg) always
  costs at the current average and never changes it. A transfer's inbound
  leg carries the source warehouse's average cost forward, so moving stock
  between warehouses doesn't distort either side's valuation.
- Stock counts are a single-step MVP flow (`submitStockCount`): one
  submission captures the system quantity, the counted quantity, and
  immediately posts a variance adjustment and finalizes — there's no
  separate open → review → approve workflow yet.
- `postMovement` locks the balance row with `SELECT ... FOR UPDATE` and
  rejects a movement that would take quantity negative
  (`InsufficientStockError`) — verified directly against a live transfer
  that over-requested stock.

## Phase 2 notes

- Every product gets at least one variant automatically (see the comment on
  `product_variants` in `packages/db/src/schema/catalog.ts`) — there's no
  separate "simple product" code path.
- UoM conversions (e.g. box ↔ piece) are per-product, not global, since the
  same "Box" means a different quantity for different products.
- The chart of accounts table is named `ledger_accounts` (not `accounts`)
  to avoid colliding with the NextAuth adapter's own `accounts` table.
- Excel import (`/products`, `/customers`, `/suppliers`) parses the upload
  inline in a server action rather than going through the worker queue —
  fine for MVP-sized files; move it to a BullMQ job if large imports start
  timing out.

## Tenant resolution: single domain, not per-tenant subdomains

The build plan originally sketched per-tenant subdomains
(`shopname.yourerp.lk` via Cloudflare/Vercel wildcard routing). This app
instead serves every tenant from one fixed domain and resolves the tenant
from a **shop slug** entered at login (`tenants.slug`), not from the
hostname. Login is shop slug + email + password — see `apps/web/auth.ts`.
This avoids wildcard DNS/SSL and a wildcard routing layer entirely; the
trade-off is no per-tenant branded URL, which isn't a current requirement.

## Notes / known limitations

- Row-Level Security policies exist (`packages/db/migrations/0001_enable_rls.sql`
  and the `*_phase2`/`*_phase3` follow-ups) but are inert until the app
  connects as a non-owner Postgres role — see the comment at the top of
  `0001_enable_rls.sql`.
- `apps/worker` only has a placeholder `maintenance` queue/job to prove the
  Redis wiring; no real background jobs yet.
- `npm run db:seed` is safe to re-run (it's how new system permissions get
  granted to existing roles after a schema change) — this relies on
  `roles` having a unique index on `(tenant_id, name)`
  (`0006_living_karnak.sql`). That index was added after a real bug: before
  it existed, re-running the seed silently inserted duplicate role rows
  each time, and `seed.ts`'s permission-sync loop skipped already-existing
  roles entirely, so re-seeding after adding new `PERMISSIONS` keys never
  actually granted them. If you ever see role-permission counts looking
  wrong, check for duplicate `roles` rows first.
