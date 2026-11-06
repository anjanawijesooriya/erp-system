import { AuthShell } from "@/components/auth-shell";
import { AccountantLoginForm } from "./login-form";

export default function AccountantLoginPage() {
  return (
    <AuthShell
      title="Accountant portal"
      subtitle="Access every company that's invited you, from one login."
      panel={{
        tone: "slate",
        badge: "For external accountants",
        heading: "One login, every company you work with.",
        body: "Each company you're linked to grants you view-only or posting access — you choose nothing, they do.",
        features: [
          { title: "Multi-company switching", body: "Jump between every linked company from one dashboard." },
          { title: "Trial balance & journal, live", body: "Figures are always current, never a stale export." },
          { title: "Access you don't self-grant", body: "A company's owner invites you — you can't add yourself." },
        ],
      }}
    >
      <AccountantLoginForm />
    </AuthShell>
  );
}
