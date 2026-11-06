# Nexora ERP — Complete User Guide

*A system workflow guide covering every module, from setting up a shop to running day-to-day operations, with worked examples. Written for shop owners, cashiers, accountants, and anyone operating the system — not for developers (see `README.md` for that).*

---

## Table of contents

1. [What this system is](#1-what-this-system-is)
2. [Getting started](#2-getting-started)
3. [Initial setup — before you sell anything](#3-initial-setup--before-you-sell-anything)
4. [A day in the life — end-to-end walkthrough](#4-a-day-in-the-life--end-to-end-walkthrough)
5. [Module reference](#5-module-reference)
   - [5.1 Master data](#51-master-data)
   - [5.2 Inventory](#52-inventory)
   - [5.3 Purchasing](#53-purchasing)
   - [5.4 Sales](#54-sales)
   - [5.5 Point of sale (POS)](#55-point-of-sale-pos)
   - [5.6 Accounting](#56-accounting)
   - [5.7 Reports & dashboard](#57-reports--dashboard)
   - [5.8 HR & payroll](#58-hr--payroll)
   - [5.9 Manufacturing](#59-manufacturing)
   - [5.10 E-commerce sync](#510-e-commerce-sync)
   - [5.11 Pilot support tools](#511-pilot-support-tools)
   - [5.12 Accountant portal](#512-accountant-portal)
   - [5.13 Platform admin](#513-platform-admin)
   - [5.14 Settings](#514-settings)
6. [Roles and who can do what](#6-roles-and-who-can-do-what)
7. [Appendix](#7-appendix)

---

## 1. What this system is

Nexora ERP is a multi-tenant ERP/POS platform for local shops and wholesalers — one system covering inventory, purchasing, sales, accounting, payroll, light manufacturing, and e-commerce sync, built so that a sale at the counter flows automatically through to your trial balance without anyone re-typing anything.

Three ideas run through every module and are worth knowing before you start:

- **Nothing is ever edited or deleted, only reversed.** A wrong invoice isn't fixed by changing it — you post a return or a correcting entry, and both the mistake and the fix stay on the record. This is what makes every report trustworthy.
- **Stock and money move together.** Receiving goods, selling goods, and making/receiving payments automatically post the correct accounting entries behind the scenes. You almost never need to touch the Journal directly.
- **Every shop (tenant) is isolated.** If you run multiple shops/companies, each is a separate workspace with its own data, users, and books.

---

## 2. Getting started

### 2.1 Creating your shop (sign-up)

Go to `/signup`. You'll fill in two sections:

1. **Your shop** — shop name, a *slug* (lowercase, used to sign in — e.g. `my-hardware-shop`), and your business type (hardware, pharmacy, grocery, textile, wholesale, or general). The business type picks a starter chart of accounts with a few extra accounts relevant to that trade (e.g. pharmacies get an "Expired/Damaged Stock Write-off" account).
2. **Your account** — your name, email, and a password (minimum 8 characters).

**Example:** Signing up a new hardware shop called "Perera Hardware" with slug `perera-hardware` automatically creates:
- A Head Office branch
- A full chart of accounts (Cash, Bank, Receivables, Payables, Inventory, Sales Revenue, COGS, Expenses, etc.)
- Four system roles (Owner, Accountant, Branch Manager, Cashier)
- You, as Owner, on the free POS plan (upgradeable later)

### 2.2 Signing in

Go to `/login`. Unlike most systems, sign-in needs **three** things, not two:

| Field | Example |
|---|---|
| Shop | `demo-hardware` |
| Email | `owner@demo.shop` |
| Password | `ChangeMe123!` |

The shop slug is what tells the system which company's books you're signing into — the same email could exist in two different shops.

### 2.3 Roles, in one line each

- **Owner** — everything.
- **Accountant** — posts journals, closes periods, runs payroll, imports opening balances, views all financial reports.
- **Branch Manager** — runs day-to-day operations for one branch: stock, purchasing, sales, HR, manufacturing, e-commerce — but can't post manual journal entries or close accounting periods.
- **Cashier** — sells at the POS, nothing else (can't see cost prices or post anything financial).

---

## 3. Initial setup — before you sell anything

Do these in order the first time:

1. **Chart of accounts** is already there (auto-created at sign-up) — check it at `Chart of Accounts` if you want to add your own expense categories.
2. **Warehouses** (`Inventory → Warehouses`) — at least one, tied to a branch. *Example: "Main Store — Colombo", code `MAIN`.*
3. **Products** (`Master data → Products`) — SKU, name, base unit of measure (e.g. "Piece"), cost price, selling price. You can add unit conversions too (e.g. 1 box = 24 pieces).
4. **Customers / Suppliers** (`Master data → Customers` / `Suppliers`) — name, phone, credit limit, credit term days (e.g. 30 days).
5. **Opening balances**, if you're migrating from an old system — see [5.11 Pilot support tools](#511-pilot-support-tools).
6. **Invoice branding** (`Settings → Invoice Branding`) — your logo, accent color, address/phone/email, and a footer note, so printed invoices look like your shop's, not a generic template.

**Bulk setup tip:** Products, customers, and suppliers all support Excel import — if you're migrating from a spreadsheet, use the import option on each page instead of typing everything in one at a time.

---

## 4. A day in the life — end-to-end walkthrough

This section follows one example transaction all the way through the system, so you can see how the modules connect.

**Scenario:** Perera Hardware buys 50 hammers from a supplier, then sells 2 of them to a walk-in customer at the counter.

### Step 1 — Order stock from a supplier
`Purchasing → Purchase Orders` → new PO to "ABC Tools Ltd" for 50 hammers at Rs. 800 each.

### Step 2 — Receive the goods (GRN)
When the hammers physically arrive: `Purchasing → GRN` → post a Goods Received Note against that PO. This is the moment stock actually increases — the stock ledger gets a real, permanent movement, and the system posts:
```
Dr  Inventory (GRN value)       40,000
    Cr  GRN Clearing                    40,000
```

### Step 3 — Record the supplier's invoice
`Purchasing → Supplier Invoices` → match it to the GRN. This clears the GRN Clearing account and creates a real payable:
```
Dr  GRN Clearing               40,000
    Cr  Accounts Payable                40,000
```

### Step 4 — Pay the supplier
`Purchasing → Supplier Payments` → pay Rs. 40,000 by bank transfer, allocated against that invoice. `Payables Aging` now shows nothing outstanding for ABC Tools.

### Step 5 — Sell at the counter
A customer walks in wanting 2 hammers. At the register:
1. If the till isn't open yet, `POS` first asks you to **open the register** — count your starting cash float (e.g. Rs. 5,000) and confirm.
2. Click the "Hammer" product card twice (or once, then bump the quantity to 2) — it's added to the cart at Rs. 1,200 each.
3. Pick **Cash** as the payment method, click **Complete sale**.

This single click does four things at once, atomically:
- Raises a sales invoice (Rs. 2,400)
- Posts a delivery, reducing stock by 2 units
- Records a payment, marking the invoice paid
- Posts the accounting entries:
```
Dr  Cash in Hand                2,400
    Cr  Sales Revenue                    2,400
Dr  Cost of Goods Sold            1,600   (2 × weighted-avg cost)
    Cr  Inventory                        1,600
```

### Step 6 — End of day
Still on the POS screen: **Close register**. Enter what you actually counted in the drawer. The system already knows the expected amount (opening float + every cash sale since you opened), so it tells you the variance immediately — Rs. 0 means the till balanced.

### Step 7 — Check the numbers
`Reports` or `Accounting → Reports` shows today's sales, margin on the hammer sale, and the P&L already reflecting both the purchase and the sale — no manual bookkeeping needed anywhere in this flow.

---

## 5. Module reference

### 5.1 Master data

| Screen | What it's for |
|---|---|
| Products | SKUs, variants, units of measure, cost/selling price, barcodes |
| Customers | Credit limit, credit term days, contact details |
| Suppliers | Same, for the other side of the ledger |
| Chart of Accounts | Your tenant's accounts — add custom expense categories here |

**Example:** Adding a product with unit conversion — "Nails" sold by the Kg but bought from the supplier by the 25kg bag: set base UoM = `KG`, then add a conversion `BAG = 25 KG`. Purchasing can then order in bags while stock and sales stay in kilograms.

### 5.2 Inventory

| Screen | What it's for |
|---|---|
| Warehouses | Physical/logical stock locations, tied to a branch |
| Stock | Current on-hand quantity and value, by warehouse |
| Transfers | Move stock between two warehouses |
| Adjustments | Correct stock for damage, loss, or found items — always with a reason, never a silent edit |
| Stock Counts | Physical count reconciliation — enter what you counted, the system posts the adjusting movement automatically |

Every single change to stock — a sale, a purchase, a transfer, an adjustment, a production order — writes a permanent row to the stock ledger. "Stock on hand" is never a number you edit; it's always the sum of these rows.

### 5.3 Purchasing

**Flow:** Purchase Order → GRN → Supplier Invoice → Supplier Payment (with Purchase Returns and Payables Aging alongside).

| Screen | What it's for |
|---|---|
| Purchase Orders | What you've ordered from a supplier |
| GRN | What's actually arrived (can differ from the PO) |
| Supplier Invoices | The supplier's bill, matched to the GRN |
| Supplier Payments | Paying what you owe, allocated to specific invoices |
| Purchase Returns | Sending goods back to a supplier |
| Payables Aging | Who you owe, and how overdue |

### 5.4 Sales

**Flow:** Quotation → Sales Order → Sales Invoice → Delivery → Receipt (with Sales Returns and Receivables Aging alongside).

| Screen | What it's for |
|---|---|
| Quotations | A price quote for a customer, not yet a commitment |
| Sales Orders | A confirmed order, not yet invoiced |
| Sales Invoices | The bill — click **View / Print** on any invoice to get a branded, printable PDF-ready page |
| Deliveries | Shipping/handing over goods (moves stock) |
| Receipts | Payments received from customers |
| Sales Returns | Customer sends something back (credit note) |
| Receivables Aging | Who owes you, and how overdue |

**Example — credit sale:** A regular customer with 30-day credit terms buys Rs. 50,000 of goods. You raise a Sales Invoice (due date auto-calculated: today + 30 days), post a Delivery to move the stock out, and the invoice sits as "unpaid" on Receivables Aging until a Receipt is recorded against it.

### 5.5 Point of sale (POS)

The fast path for walk-in, pay-now sales — see the [day-in-the-life example](#4-a-day-in-the-life--end-to-end-walkthrough) above for the full flow. Key things to know:

- **You must open the cash register** before the POS will let you sell anything — this is deliberate, so every shift's cash is accounted for.
- Clicking a product card adds one unit to the cart; click again (or use the +/− stepper in the cart) to adjust quantity.
- Payment methods: Cash, Bank, Cheque. Only **cash** sales count toward the register's expected closing balance.
- **Closing the register** shows you the variance (counted − expected) immediately — use this to catch missing or duplicate sales before they pile up.

### 5.6 Accounting

| Screen | What it's for |
|---|---|
| Expenses | Simple day-to-day spending entry (rent, utilities, supplies) — pick a category, amount, and who it was paid from; no debit/credit knowledge needed |
| Journal | Manual double-entry postings, for anything the other modules don't auto-post — restricted to Accountant/Owner |
| Periods | Lock a month once it's finalized so nothing can be posted into it by accident |
| Cheques | Post-dated cheque tracking (received and issued) |
| Bank Reconciliation | Match your bank statement against what the system recorded |
| Reports | Trial Balance, Profit & Loss, Balance Sheet |

**Example — recording an expense:** `Accounting → Expenses` → date, branch, category "Utilities Expense", amount Rs. 4,500, paid from "Cash in hand", description "Electricity bill for October". This posts `Dr Utilities Expense / Cr Cash in Hand` for you — no journal entry needed.

### 5.7 Reports & dashboard

The **Dashboard** gives an at-a-glance view: today's sales, customer/supplier counts, this month's net profit, a 14-day sales chart, a 6-month revenue-vs-expenses chart, and top products by revenue — plus quick links into the screens you use most.

`Reports` adds: sales by day, top products, top customers, margin by product, dead stock (items not selling), and stock valuation.

### 5.8 HR & payroll

| Screen | What it's for |
|---|---|
| Employees | Staff records — basic salary, fixed allowances, EPF/ETF member numbers, bank details. Separate from system *users*, since most paid staff never log in. |
| Payroll | Run a month's payroll, then mark it paid |

**Example — running November payroll:** `HR → Payroll` → select branch, year 2026, month 11 → **Run payroll**. For every active employee, the system computes:
- EPF: 8% employee + 12% employer, on basic salary only
- ETF: 3% employer, on basic salary only
- APIT (income tax): from a built-in bracket table, computed on (gross − employee EPF)
- Net pay: gross − employee EPF − APIT

This posts a journal entry splitting gross salary expense, employer EPF/ETF cost, and the resulting EPF/ETF/APIT/net-pay liabilities. Once reviewed, click **Mark paid** to record the actual bank/cash disbursement — a separate step from "run," so you can review before money moves.

### 5.9 Manufacturing

For shops that assemble or process goods rather than just reselling them.

1. **Bills of Materials** (`Manufacturing → Bills of Materials`) — define a recipe: one output product + a list of component products and quantities needed per batch.
2. **Production Orders** (`Manufacturing → Production Orders`) — create an order against a BOM for N batches, then **Complete** it once production is actually done, entering the actual output quantity (which can differ from planned, e.g. if some was spoiled).

**Example:** A hardware shop assembles "Tool Kit Combo" from 1× hammer + 1× screwdriver set + 1× tape measure. The BOM defines that recipe; a production order for 10 kits consumes 10 of each component and produces 10 kits, each costed at the actual total component cost ÷ actual output — no separate accounting entry needed, since the value just moves from components to finished goods.

### 5.10 E-commerce sync

For shops with an online storefront (their own site, or a platform like WooCommerce/Shopify).

1. `E-commerce → Sales Channels` → create a channel (e.g. "Main Website"). This generates an **API key** (for the storefront to read your product feed) and a **webhook secret** (to sign incoming orders).
2. **Link products**: map your internal SKU to however the storefront identifies that product.
3. The storefront polls `/api/ecommerce/feed/{apiKey}` for live price/stock, and POSTs new orders to `/api/ecommerce/webhook/{apiKey}` (signed with the webhook secret) — each valid order automatically becomes a real sales order in the system.

### 5.11 Pilot support tools

Built for the "run in parallel with the old system for a month" migration period — see `PILOT.md` for the full process checklist.

| Screen | What it's for |
|---|---|
| Opening Balances | One-time go-live import: opening stock, opening customer balances (receivables), opening supplier balances (payables) — posted as real, correct ledger entries against an "Opening Balance Equity" account, not a backdoor edit |
| Weekly Reconciliation | Enter the shop's manually-counted figure for sales/cash/stock value; the system figure is always computed live, so the comparison never goes stale |
| Issues | An in-app bug/confusion tracker — any role can report, managers triage |

### 5.12 Accountant portal

A **separate login** (`/accountant/login`) for an external accountant who works across multiple shops. A shop owner invites an accountant by email from `Settings → Linked Accountants`; the accountant then signs in once and switches between every company that's invited them, seeing a live trial balance and journal list for each (currently view-only).

### 5.13 Platform admin

A **separate login** (`/admin/login`) for whoever operates the platform itself (not a shop owner). Lists every tenant with usage (branches/users/products), lets you change a tenant's plan tier, and shows a cross-tenant view of every pilot issue reported, from any shop.

### 5.14 Settings

| Screen | What it's for |
|---|---|
| Settings | Tenant name, business details |
| Invoice Branding | Logo, accent color, letterhead address/phone/email, footer note — applied to every printed sales invoice |
| Linked Accountants | Invite/remove external accountant access |
| Users | Add staff logins and assign them a role |

---

## 6. Roles and who can do what

| Can they... | Owner | Accountant | Branch Manager | Cashier |
|---|:---:|:---:|:---:|:---:|
| Sell at POS | ✅ | — | ✅ | ✅ |
| Manage products/customers/suppliers | ✅ | — | ✅ | — |
| Purchasing (PO/GRN/invoices) | ✅ | partial | ✅ | — |
| Post manual journal entries | ✅ | ✅ | — | — |
| Close accounting periods | ✅ | ✅ | — | — |
| Record a simple expense | ✅ | ✅ | ✅ | — |
| Run payroll | ✅ | ✅ | — | — |
| Manage employees | ✅ | — | ✅ | — |
| Manufacturing (BOM/production) | ✅ | — | ✅ | — |
| E-commerce channels | ✅ | — | ✅ | — |
| Import opening balances (go-live) | ✅ | ✅ | — | — |
| Report a pilot issue | ✅ | ✅ | ✅ | ✅ |
| Manage users & settings | ✅ | — | — | — |

---

## 7. Appendix

### Demo credentials (seeded data, for trying the system)

| System | Login | Credentials |
|---|---|---|
| Tenant app | `/login` | shop `demo-hardware`, `owner@demo.shop` / `ChangeMe123!` |
| Platform admin | `/admin/login` | `admin@platform.local` / `AdminPass123!` *(change before any real deployment)* |

### Plan tiers

| Tier | Includes |
|---|---|
| POS | Sales, POS — 1 branch, 3 users, 200 products |
| Business | + Inventory, Purchasing — 5 branches, 15 users, 2,000 products |
| ERP | + Accounting, Payroll, Manufacturing, E-commerce, Accountant portal — unlimited |

### Known limitations, honestly stated

- Purchase/sales returns don't automatically net against the aging reports — a return is its own document.
- Payment overpayments beyond the total outstanding aren't tracked as a credit balance.
- The accountant portal is currently **view-only** — an accountant can see a company's books but not post journal entries into them yet.
- The super-admin "view tenant" action is an audit-logged event, not true session impersonation.
- The daily SMS summary needs real Notify.lk credentials configured before it will actually send.

---

*This guide covers the system as built. For architectural/technical documentation, see `README.md`; for the real-world pilot process, see `PILOT.md`.*
