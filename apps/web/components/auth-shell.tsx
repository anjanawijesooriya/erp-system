import type { ReactNode } from "react";

const TENANT_FEATURES = [
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

export interface AuthShellPanel {
  badge: string;
  heading: string;
  body: string;
  features: { title: string; body: string }[];
  /** "brand" for the tenant-facing login/signup; "slate" for internal tools (platform admin, accountant portal) — same chrome, a visibly different tone so it never reads as "your shop". */
  tone?: "brand" | "slate";
}

const DEFAULT_PANEL: AuthShellPanel = {
  badge: "Built for local retailers & wholesalers",
  heading: "Run your whole shop from one system.",
  body: "Inventory, purchasing, sales, accounting, payroll, and reporting — all in sync, all in one place.",
  features: TENANT_FEATURES,
  tone: "brand",
};

/**
 * Shared layout for every auth-adjacent page — tenant login/signup,
 * platform-admin login, and the accountant-portal login all use this
 * with different `panel` copy/tone, so each reads as the same product
 * family without the internal tools pretending to be a tenant's shop. A
 * single floating card centered over a soft gradient backdrop, split
 * internally into the form and a branded panel.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide = false,
  panel = DEFAULT_PANEL,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  panel?: AuthShellPanel;
}) {
  const tone = panel.tone ?? "brand";
  const panelGradient =
    tone === "slate"
      ? "from-slate-800 via-slate-900 to-black"
      : "from-brand-700 to-brand-900";
  const blobA = tone === "slate" ? "bg-slate-400/10" : "bg-accent-400/20";
  const blobB = tone === "slate" ? "bg-slate-500/10" : "bg-brand-400/20";
  const badgeText = tone === "slate" ? "text-slate-200" : "text-brand-100";
  const bodyText = tone === "slate" ? "text-slate-300" : "text-brand-100";
  const featureBodyText = tone === "slate" ? "text-slate-400" : "text-brand-200";
  const checkColor = tone === "slate" ? "text-emerald-400" : "text-accent-400";
  const footerText = tone === "slate" ? "text-slate-500" : "text-brand-300";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% 10%, rgba(99,102,241,0.14), transparent 60%), radial-gradient(50rem 35rem at 85% 90%, rgba(16,185,129,0.12), transparent 60%)",
        }}
      />

      <div
        className={`relative grid w-full ${wide ? "max-w-5xl" : "max-w-4xl"} grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-300/40 ring-1 ring-slate-900/5 lg:grid-cols-5`}
      >
        <div className="px-6 py-10 sm:px-12 sm:py-14 lg:col-span-3">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white shadow-sm shadow-brand-700/30">
              N
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">Nexora ERP</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mb-8 mt-2 text-sm text-slate-500">{subtitle}</p>

          {children}

          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>

        <div className={`relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br ${panelGradient} p-10 text-white lg:col-span-2 lg:flex`}>
          <div aria-hidden className={`pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full ${blobA} blur-3xl`} />
          <div aria-hidden className={`pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full ${blobB} blur-3xl`} />
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
            <span className={`inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium ${badgeText} ring-1 ring-inset ring-white/20`}>
              {panel.badge}
            </span>
            <h2 className="mt-6 text-2xl font-semibold leading-tight">{panel.heading}</h2>
            <p className={`mt-3 text-sm leading-relaxed ${bodyText}`}>{panel.body}</p>
            <ul className="mt-8 space-y-4">
              {panel.features.map((f) => (
                <li key={f.title} className="flex gap-3">
                  <span className={`mt-0.5 ${checkColor}`}>
                    <CheckIcon />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{f.title}</p>
                    <p className={`text-xs leading-relaxed ${featureBodyText}`}>{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className={`relative text-xs ${footerText}`}>© {new Date().getFullYear()} Nexora ERP</p>
        </div>
      </div>
    </main>
  );
}
