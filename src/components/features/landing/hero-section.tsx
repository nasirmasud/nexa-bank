import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-landing-bg py-16 sm:py-20 lg:py-24" aria-labelledby="hero-heading">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(47,191,159,0.16),transparent_35%),radial-gradient(circle_at_left,rgba(31,58,95,0.12),transparent_30%),linear-gradient(180deg,#f7f8fa_0%,#eff4ff_100%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(47,191,159,0.18),transparent_30%),radial-gradient(circle_at_left,rgba(31,58,95,0.28),transparent_35%),linear-gradient(180deg,#06120f_0%,#0b0f14_100%)]" aria-hidden="true" />
      <div className="landing-container relative grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-landing-border bg-landing-surface/80 px-3 py-1 text-xs font-medium text-landing-primary">
            <span className="size-2 rounded-full bg-landing-primary" aria-hidden="true" />
            Role-based banking simulation
          </div>
          <h1 id="hero-heading" className="mt-6 max-w-3xl font-heading text-4xl font-bold tracking-tight text-landing-ink sm:text-5xl lg:text-6xl">
            Banking that moves <span className="text-landing-primary">as carefully</span> as your money.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-landing-muted sm:text-lg">
            An institutional-grade digital banking experience for learning and demonstration. Explore accounts, transfers, approvals, and loan workflows with clear role boundaries and transparent sample data.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#demo-credentials"
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-landing-primary px-5 py-3 text-sm font-semibold text-landing-primary-foreground transition hover:opacity-95"
            >
              Explore Demo
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-[8px] border border-landing-border bg-landing-surface/80 px-5 py-3 text-sm font-semibold text-landing-ink transition hover:bg-landing-surface-mid"
            >
              Inspect Workflow
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-landing-muted">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-landing-primary" aria-hidden="true" />Server-side authorization</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-landing-primary" aria-hidden="true" />Atomic transfer design</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-landing-primary" aria-hidden="true" />Role-based access</span>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-[12px] border border-landing-border bg-landing-surface/90 p-5 shadow-lg backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between border-b border-landing-border pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-landing-muted">Institutional Custody</p>
                <p className="mt-1 font-heading text-lg font-semibold text-landing-ink">Available Balance</p>
              </div>
              <span className="rounded-[4px] bg-landing-primary-soft px-2 py-1 text-[11px] font-semibold text-landing-primary">Sample data</span>
            </div>
            <p className="mt-5 font-heading text-4xl font-bold tabular-nums tracking-tight text-landing-ink sm:text-5xl">
              BDT 4,82,500<span className="text-landing-primary">.00</span>
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[12px] bg-landing-surface-low p-4">
                <p className="text-xs text-landing-muted">Primary Checking</p>
                <p className="mt-1 font-mono text-sm text-landing-ink">**** **** 4829</p>
              </div>
              <div className="rounded-[12px] bg-landing-surface-low p-4">
                <p className="text-xs text-landing-muted">Recent transfer</p>
                <p className="mt-1 font-mono text-sm text-landing-ink">BDT 12,500.00</p>
              </div>
            </div>
            <div className="mt-4 rounded-[12px] border border-landing-border bg-landing-surface-low p-4">
              <p className="text-xs font-medium text-landing-muted">Status</p>
              <p className="mt-1 text-sm font-semibold text-landing-primary">Transfer completed</p>
              <p className="mt-1 font-mono text-xs text-landing-muted">Tx #NX-784910 · Sample data</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-landing-muted">
              <Link href="/login?role=customer" className="underline underline-offset-4 hover:text-landing-primary">Customer demo</Link>
              <Link href="/login?role=staff" className="underline underline-offset-4 hover:text-landing-primary">Staff demo</Link>
              <Link href="/login?role=admin" className="underline underline-offset-4 hover:text-landing-primary">Admin demo</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
