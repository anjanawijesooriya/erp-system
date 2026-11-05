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
panel, per-tenant data export), and Phase 8 pilot support (opening-balance
go-live import, weekly reconciliation, an in-app issue tracker — see
`PILOT.md` for the actual pilot-running checklist, which is process, not
code), and Phase 9 expansion (HR & payroll with EPF/ETF/APIT, manufacturing/BOM
with production orders, e-commerce channel sync, and an accountant portal for
multi-company access) are done — see "Phase 9 notes" below. That's every
phase in the build plan; the one open item left is the plan's own
"ERP tier on Dukapola, or a fully separate product?" decision, resolved for
now as a fully separate product. See
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

As of 2026-11-06, `next dev` crashed once (see Phase 8 notes below — a
genuine `tailwind.config.ts` bug, now fixed) and the agent's session
couldn't restart the crashed process cleanly (process-kill permission is
request-by-request, not standing), so it started a second instance on port
3002 to verify the fix instead of fighting the dead one on 3000. **Do a
full clean restart** (close every `next dev` / `tsx watch` terminal, then
one `npm run dev` from the repo root) to collapse back down to a single
instance on port 3000 — there's nothing left to debug, this is pure
process hygiene at this point.

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

## Phase 9 notes

The build plan's last phase, "Expansion": HR/payroll, manufacturing/BOM,
e-commerce sync, and an accountant portal — all four built in one pass
since the pilot's own module list doesn't gate which of these exist, only
whether a tenant's plan includes them (`payroll`/`manufacturing`/
`ecommerce`/`accountant_portal` module keys, ERP tier only).

- **HR & payroll** (`packages/core/src/hr/`, `/hr/employees`,
  `/hr/payroll`): `employees` is deliberately separate from `users` —
  most paid staff (helpers, riders) never log in, and a Cashier who does
  log in isn't necessarily salaried. `runPayroll` computes EPF (8%
  employee / 12% employer), ETF (3%), and APIT per
  `packages/core/src/hr/apit.ts`'s bracket table — **that table is the
  2024/2025 Inland Revenue monthly brackets and will go stale after the
  next budget**; it's a plain exported array specifically so updating it
  doesn't touch the posting logic, and a past payroll run keeps whatever
  `apitAmount` it already computed. Posting splits gross salary expense,
  employer EPF/ETF *expense* (6310/6320 — the employer's own cost, on top
  of gross) from the EPF/ETF/APIT/net-pay *payable* liabilities; "posted"
  (the journal entry) and "paid" (`markPayrollPaid`, the actual bank/cash
  disbursement) are separate steps so a payroll run can be reviewed before
  money moves. Caught one real bug while posting a run where every
  employee fell under the APIT tax-free threshold: a zero-amount APIT line
  was being sent to `postJournalEntry` as `debit: undefined, credit: 0`,
  which trips "exactly one of debit/credit must be set" — fixed by
  filtering zero-amount lines out before posting (`payroll.ts`).
- **Manufacturing / BOM** (`packages/core/src/manufacturing/`,
  `/manufacturing/bom`, `/manufacturing/production`): a BOM is a recipe
  (output variant + quantity-per-batch component list); a production
  order consumes components and produces output as pure stock-ledger
  movements (`movementType: "production_consumption"` /
  `"production_output"`, new enum values on the existing
  `stock_movements` table) — **no GL entry**, since total inventory value
  just moves from components to finished goods, nothing is gained or
  lost. Output cost is the sum of actual component costs consumed
  (weighted-average, same as everywhere else), divided by actual output
  quantity — so a smaller-than-planned yield correctly costs the output
  higher per unit, not silently absorbed. The web form takes BOM
  components as one `"SKU,quantity"` line per textarea row rather than
  dynamic client-side rows, a deliberate exception to this app's usual
  single-line-per-form convention since a BOM genuinely needs several
  components.
- **E-commerce sync** (`packages/core/src/ecommerce/`,
  `/ecommerce/channels`, `/api/ecommerce/feed/[apiKey]`,
  `/api/ecommerce/webhook/[apiKey]`): deliberately generic/webhook-based
  rather than a named platform's SDK (Shopify, WooCommerce, or a shop's
  own site all integrate the same way) — a storefront polls the feed
  route for price/stock (keyed by `apiKey`) and POSTs new orders to the
  webhook route, signed with `X-Webhook-Signature` (HMAC-SHA256 of the
  raw body using a per-channel secret, the same model Stripe uses).
  Inbound orders post against one shared "Online Store Customers"
  placeholder customer (same reasoning as Phase 8's opening-balance
  placeholder product) rather than requiring every online buyer to exist
  as a real, credit-tracked customer; the actual buyer's name stays on
  the raw payload. A SKU that doesn't resolve to a linked product variant
  fails the *whole* order (`channelOrders.status = "failed"` with the
  reason), never a partial import. Initially wrote the import inside one
  outer `db.transaction`, then caught that `createSalesOrder` runs its
  own internal transaction — nesting them wouldn't actually be atomic
  with the standard `postgres` driver — so the import is now sequential
  steps instead, with `channelOrders.status` as the recoverable marker of
  how far an import got if something fails partway.
- **Accountant portal** (`packages/core/src/accountant-portal/`,
  `/accountant/login`, `/accountant`, `/settings/accountants`): an
  `accountants` principal, same reasoning as `platformAdmins` — spans
  multiple tenants, so it can't be a row in any one tenant's `users`
  table — authenticated by its own signed-cookie session
  (`apps/web/lib/accountant-session.ts`, a copy of `admin-session.ts`
  with its own cookie name). A tenant owner invites an accountant by
  email from `/settings/accountants`; the accountant then signs in once
  at `/accountant/login` and switches between every company that's
  invited them. **Currently view-only** (trial balance + journal entries
  list) despite `accountant_tenant_links.canPostJournals` already being
  modeled: actually posting a journal entry needs
  `journal_entries.created_by_user_id` to resolve to a row in that
  tenant's `users` table, which an accountant deliberately isn't. Wiring
  up real cross-tenant posting needs either a nullable
  posted-by-accountant column or a synthetic per-tenant "accountant"
  user — left for a follow-up rather than bolted on here; the flag is
  already there so that follow-up doesn't need a data migration.
- Backfilling existing tenants after adding Phase 9's new chart-of-accounts
  codes and permissions followed the same idempotent pattern as every
  earlier phase (`seedChartOfAccounts` / `seedGlobalPermissions` /
  `seedSystemRolesForTenant`, all `onConflictDoNothing`) — re-run once via
  a throwaway script against the demo tenant, not a new migration-time
  data fixup.
- All four pieces were exercised end-to-end against the real database — a
  payroll run posting and paying out correctly (balanced trial balance:
  6300/6310/6320 debits = 2300/2310/2330 credits), a production order
  consuming raw material and producing output at the correctly-computed
  cost, and a signed webhook order correctly resolving to a real sales
  order — then the test fixtures were deleted afterward the same way
  Phase 8's were (scoped `DELETE`s, not a blanket wipe).

## Phase 8 notes

- `PILOT.md` has the actual pilot-running checklist (shop selection,
  weekly reconciliation process, "ready to launch" criteria, in-person
  onboarding script outline) — this section is just the code-side notes.
- **Opening balances are real, audited documents, not a backdoor**: opening
  stock posts through the normal `postMovement` ledger
  (`movementType: "opening_balance"`); opening customer/supplier balances
  create real, agable sales/supplier invoices (visible in
  `/sales/receivables` and `/purchasing/payables`, not just a GL number).
  All three post their GL offset to a new **Opening Balance Equity (3800)**
  account, deliberately never Sales Revenue/COGS/the GRN-clearing account —
  they're not routed through `createSalesInvoice`/`createSupplierInvoice`/
  `createGrn` at all, which exist for real transactions and would post the
  wrong journal entries for a go-live balance.
- A per-tenant placeholder product (SKU `OPENING-BAL`) is created on first
  use to carry the single line item on each opening invoice — it's not
  meant to appear in product listings/reports used for day-to-day sales,
  just to satisfy the invoice-line schema's `productVariantId` requirement.
- Reconciliation (`/pilot/reconciliation`) only stores the **manual**
  figure per (date, metric) — the system figure is always computed live
  from the existing report queries at view time, so it can't go stale even
  if more documents get posted after the fact. The `stock_value` metric is
  a current-moment figure regardless of which date you attach it to (stock
  balances aren't a historical snapshot table) — documented in the code,
  only meaningful to compare against a count taken today.
- The issue tracker (`/pilot/issues`) is tenant-scoped for reporting/triage
  (every role including Cashier can report); the super-admin panel
  (`/admin`) additionally shows a cross-tenant view with its own
  tenant-unscoped status-update action (`updateIssueStatusAsAdmin`),
  deliberately separate from the tenant-scoped `updateIssueStatus` so a
  normal tenant user can never accidentally (or deliberately) touch another
  tenant's issue.
- **Two tenancy-safety gaps caught and fixed while writing this phase,
  before they shipped**: the first draft of `updateIssueStatus` had no
  `tenantId` filter in its WHERE clause at all (would have let any tenant
  user close any other tenant's issue by id if they guessed/enumerated it);
  caught immediately while wiring the web action and fixed before any live
  testing. This is the same category of mistake as `deactivateUser`'s
  first draft back in the SaaS-platform round — worth being deliberately
  suspicious of any `update`/`delete` function that takes an id without
  also taking (and filtering by) a tenant id.
- **A real, unrelated crash found and fixed along the way**: `next dev`
  crashed outright (`ReferenceError: require is not defined`) in
  `apps/web/tailwind.config.ts`, which had used CommonJS `require()` inside
  a `.ts` config file since Phase 1 — apparently fine until some Next.js/
  Node module-loading path change finally tripped over it, mid this
  session, unrelated to anything Phase 8 touched. Fixed by switching to a
  static `import` and adding a `tailwind.preset.d.ts` declaration (plus a
  `types` condition in `packages/ui/package.json`'s export map) so the
  untyped `.js` preset file still typechecks. If you ever see this error
  again, it's almost certainly this same category of issue (a config file
  mixing CJS/ESM), not application code.
- Verified against the live DB: posted a 15,000 opening customer balance,
  an 8,000 opening supplier balance, and 200 units of opening stock at
  cost 1,200 — confirmed AR/AP/Inventory/Opening Balance Equity all landed
  at the exactly correct amounts on the trial balance, and confirmed both
  opening invoices showed up correctly in the receivables/payables aging
  reports as real, current, non-overdue items. Separately verified the
  reconciliation comparison (manual vs. live-computed system figure) and
  the full issue lifecycle (report → tenant-scoped update → cross-tenant
  admin view → admin-scoped update), including that `reportedBy`/`tenant`
  relational data resolves correctly.

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
