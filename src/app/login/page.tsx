"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const demos = [
  { label: "Admin", email: "admin@nexabank.com", password: "Password@123" },
  { label: "Staff", email: "staff@nexabank.com", password: "Password@123" },
  { label: "Customer", email: "customer@nexabank.com", password: "Password@123" },
];

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (res?.error) { setError("Invalid credentials or account disabled."); return; }
    router.push(res?.url || "/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-teal-400">NexaBank</p>
          <h1 className="mt-2 text-3xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-slate-400">Secure access to your banking workspace.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-slate-300">Email</span>
            <input className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 outline-none focus:border-teal-500" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Password</span>
            <input className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 outline-none focus:border-teal-500" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={loading} className="w-full rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-60 px-4 py-2 font-medium">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-400 mb-2">Demo accounts</p>
          <div className="flex gap-2 flex-wrap">
            {demos.map((d) => (
              <button key={d.label} type="button" onClick={() => { setEmail(d.email); setPassword(d.password); }} className="text-xs px-3 py-1.5 rounded-full border border-slate-700 hover:border-teal-500 text-slate-300">
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
