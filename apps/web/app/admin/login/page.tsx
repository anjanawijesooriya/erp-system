import { AuthShell } from "@/components/auth-shell";
import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <AuthShell
      title="Platform admin"
      subtitle="Internal staff only — tenant accounts sign in at /login instead."
      panel={{
        tone: "slate",
        badge: "Internal tools",
        heading: "The control center behind every shop on Nexora.",
        body: "Tenant oversight, plan management, and cross-tenant support — all audit-logged.",
        features: [
          { title: "Usage & plan oversight", body: "See every tenant's branches, users, and products at a glance." },
          { title: "Plan changes", body: "Move a tenant between POS, Business, and ERP tiers." },
          { title: "Cross-tenant pilot issues", body: "Triage support issues reported from any shop, in one place." },
        ],
      }}
    >
      <AdminLoginForm />
    </AuthShell>
  );
}
