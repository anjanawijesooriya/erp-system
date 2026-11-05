import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Sign in</h1>
        <p className="mb-6 text-sm text-slate-500">
          Demo login: shop <code>demo-hardware</code>, owner@demo.shop / ChangeMe123!
        </p>
        <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} />
      </div>
    </main>
  );
}
