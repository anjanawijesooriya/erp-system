import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your shop's workspace."
      footer={
        <>
          New shop?{" "}
          <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
            Create your account
          </Link>
        </>
      }
    >
      <div className="mb-5 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-xs text-brand-800">
        <span className="font-semibold">Demo login:</span> shop <code className="font-mono">demo-hardware</code>,{" "}
        owner@demo.shop / ChangeMe123!
      </div>
      <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} />
    </AuthShell>
  );
}
