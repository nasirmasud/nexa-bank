"use client";

import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Landmark, Lock, ShieldCheck, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/features/landing/theme-toggle";
import { DEMO_CREDENTIAL_LIST, getDemoCredential, type DemoRole } from "@/lib/demo-credentials";
import { getRoleHome } from "@/lib/role-home";

function NexaMark({ light = false }: { light?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-landing-primary text-landing-primary-foreground shadow-sm">
        <Landmark className="size-5" aria-hidden="true" />
      </span>
      <span className={`font-heading text-xl font-bold tracking-tight ${light ? "text-white" : "text-landing-ink"}`}>
        Nexa<span className="text-landing-primary">Bank</span>
      </span>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const roleParam = params.get("role");
  const roleDemo = getDemoCredential(roleParam);

  const [email, setEmail] = useState(roleDemo?.email ?? "");
  const [password, setPassword] = useState(roleDemo?.password ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState<DemoRole | null>(roleDemo?.role ?? null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (res?.error) {
      setError("Invalid credentials or account disabled.");
      return;
    }
    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;
    const home = getRoleHome(role);
    const target = callbackUrl && callbackUrl !== "/" ? callbackUrl : home || "/";
    router.push(target);
    router.refresh();
  }

  function fillDemo(role: DemoRole) {
    const demo = getDemoCredential(role);
    if (!demo) return;
    setEmail(demo.email);
    setPassword(demo.password);
    setActiveRole(role);
    setError("");
  }

  return (
    <div className="min-h-screen bg-landing-bg text-landing-ink lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#0b1f1a] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div className="absolute inset-0 landing-dot-grid opacity-20" aria-hidden="true" />
        <div
          className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-landing-primary/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <NexaMark light />
        </div>
        <div className="relative max-w-xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            Secure workspace
          </p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-white xl:text-5xl">
            Welcome back to your banking workspace
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Sign in to manage accounts, review transactions, and access role-based operations in the NexaBank simulator.
          </p>
          <ul className="mt-10 space-y-4">
            {[
              { icon: ShieldCheck, text: "Server-side authorization for protected actions" },
              { icon: Zap, text: "Atomic transfers designed to prevent partial updates" },
              { icon: Lock, text: "PIN-protected sensitive operations" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.text} className="flex items-start gap-3 text-sm text-slate-200">
                  <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.08] text-emerald-300 ring-1 ring-white/10">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="pt-1 leading-6">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">
          Simulated banking platform. No real money involved.
        </p>
      </aside>

      <div className="flex min-h-screen flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-[8px] text-sm font-medium text-landing-muted transition hover:text-landing-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to home
          </Link>
          <ThemeToggle className="border-landing-border bg-landing-surface text-landing-ink hover:bg-landing-surface-mid" />
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8 sm:py-10">
          <div className="mb-6 lg:hidden">
            <NexaMark />
          </div>

          <div className="rounded-[12px] border border-landing-border bg-landing-surface p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">
                NexaBank
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-landing-ink">
                Sign in
              </h2>
              <p className="mt-2 text-sm leading-6 text-landing-muted">
                Secure access to your banking workspace.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5" noValidate={false}>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-landing-ink" htmlFor="login-email">
                  Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  className="w-full rounded-[8px] border border-landing-border bg-landing-bg px-3.5 py-2.5 text-sm text-landing-ink outline-none transition placeholder:text-landing-muted/70 focus:border-landing-primary focus:ring-2 focus:ring-landing-primary/20"
                  type="email"
                  autoComplete="email"
                  placeholder="you@nexabank.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-landing-ink" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    className="w-full rounded-[8px] border border-landing-border bg-landing-bg px-3.5 py-2.5 pr-11 text-sm text-landing-ink outline-none transition placeholder:text-landing-muted/70 focus:border-landing-primary focus:ring-2 focus:ring-landing-primary/20"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-landing-muted transition hover:text-landing-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary"
                  >
                    {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-[8px] border border-landing-danger/20 bg-landing-danger/10 px-3 py-2 text-sm text-landing-danger" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-[8px] bg-landing-primary px-4 py-2.5 text-sm font-semibold text-landing-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary focus-visible:ring-offset-2 focus-visible:ring-offset-landing-surface"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>

          <div className="mt-6 rounded-[12px] border border-landing-border bg-landing-surface p-5 sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">
                  Demo accounts
                </p>
                <h3 className="mt-2 font-heading text-lg font-semibold text-landing-ink">
                  Quick access credentials
                </h3>
              </div>
              <p className="text-xs text-landing-muted">Use fills the form only</p>
            </div>

            <div className="mt-4 space-y-3">
              {DEMO_CREDENTIAL_LIST.map((demo) => {
                const active = activeRole === demo.role;
                return (
                  <div
                    key={demo.role}
                    className={`rounded-[10px] border p-4 transition ${
                      active
                        ? "border-landing-primary/40 bg-landing-primary-soft/40"
                        : "border-landing-border bg-landing-bg/40"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-landing-ink">{demo.label}</span>
                          <span className="rounded-[4px] border border-landing-border bg-landing-surface px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-landing-muted">
                            {demo.role}
                          </span>
                          {active && (
                            <span className="text-[11px] font-medium text-landing-primary">Selected</span>
                          )}
                        </div>
                        <p className="mt-1 truncate font-mono text-sm text-landing-muted">{demo.email}</p>
                        <p className="mt-0.5 font-mono text-xs text-landing-muted">
                          Password: <span className="text-landing-ink">{demo.password}</span>
                          {demo.pin ? (
                            <>
                              {" · "}PIN: <span className="text-landing-ink">{demo.pin}</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fillDemo(demo.role)}
                          className="inline-flex items-center justify-center rounded-[8px] bg-landing-primary px-3 py-2 text-sm font-medium text-landing-primary-foreground transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-xs leading-5 text-landing-muted">
              <span className="font-semibold text-landing-ink">For simulation only.</span> Do not enter real personal or banking data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-landing-bg" />}>
      <LoginForm />
    </Suspense>
  );
}
