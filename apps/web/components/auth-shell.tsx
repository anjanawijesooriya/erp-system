import type { ReactNode } from "react";

const FEATURES = [
  { title: "One ledger, every branch", body: "Stock, sales, and accounting stay in sync across every location." },
  { title: "Built for Sri Lankan shops", body: "Credit customers, post-dated cheques, EPF/ETF/APIT payroll, all native." },
  { title: "From POS to balance sheet", body: "A sale at the counter flows straight through to your trial balance." },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Shared split-screen layout for every auth-adjacent page (login, signup, admin/accountant logins can opt out and use a plainer card instead). */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="flex min-h-screen bg-slate-50">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-slate-950 p-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 font-bold text-white backdrop-blur">
              N
            </div>
            <span className="text-lg font-semibold tracking-tight">Nexora ERP</span>
          </div>
          <h2 className="mt-16 text-3xl font-semibold leading-tight">
            Run your whole shop from one system.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-brand-100">
            Inventory, purchasing, sales, accounting, payroll, and reporting — built for local
            retailers and wholesalers, not retrofitted from a generic template.
          </p>
          <ul className="mt-10 space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="mt-0.5 text-accent-400">
                  <CheckIcon />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{f.title}</p>
                  <p className="text-sm text-brand-200">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-brand-300">© {new Date().getFullYear()} Nexora ERP. Built for local shops.</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className={`w-full ${wide ? "max-w-xl" : "max-w-sm"}`}>
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
              N
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">Nexora ERP</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mb-8 mt-1.5 text-sm text-slate-500">{subtitle}</p>

          {children}

          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
