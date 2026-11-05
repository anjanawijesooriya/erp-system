import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Create your shop</h1>
        <p className="mb-6 text-sm text-slate-500">Set up your own ERP in a minute.</p>
        <SignupForm />
      </div>
    </main>
  );
}
