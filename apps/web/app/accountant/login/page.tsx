import { AccountantLoginForm } from "./login-form";

export default function AccountantLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-800 p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-white">Accountant portal</h1>
        <p className="mb-6 text-sm text-slate-400">Access to the companies you've been linked to.</p>
        <AccountantLoginForm />
      </div>
    </main>
  );
}
