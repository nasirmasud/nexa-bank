import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroBackground } from "./hero-background";

const trustPoints = [
  "Server-side authorization",
  "Atomic transfer design",
  "Role-based access",
];

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-[#06120f] py-16 text-white sm:py-20 lg:py-24"
      aria-labelledby="hero-heading"
    >
      <HeroBackground />
      <div className="landing-container relative grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-[#7bd7bd] backdrop-blur-sm">
            <span className="size-2 rounded-full bg-[#2fbf9f]" aria-hidden="true" />
            Role-based banking simulation
          </div>

          <h1
            id="hero-heading"
            className="mt-6 max-w-3xl font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
          >
            Banking that moves{" "}
            <span className="text-[#2fbf9f]">as carefully</span> as your money.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/82 sm:text-lg sm:leading-8 lg:max-w-xl">
            Accounts, PIN-protected transfers and loans, built on atomic ledger
            updates and server-enforced roles.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#demo-credentials"
              className="inline-flex items-center justify-center rounded-[8px] bg-landing-primary px-6 py-3.5 text-sm font-semibold text-landing-primary-foreground shadow-[0_12px_30px_rgba(14,124,102,0.35)] transition hover:bg-landing-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#06120f]"
            >
              Try live demo
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-[8px] border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06120f]"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/72">
            <span className="font-medium text-white/86">Jump in as:</span>
            <Link
              href="/login?role=customer"
              className="font-medium text-[#7bd7bd] underline decoration-[#7bd7bd]/40 underline-offset-4 transition hover:text-[#2fbf9f] hover:decoration-[#2fbf9f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#06120f] rounded-sm"
            >
              Customer
            </Link>
            <span aria-hidden="true" className="text-white/35">·</span>
            <Link
              href="/login?role=staff"
              className="font-medium text-[#7bd7bd] underline decoration-[#7bd7bd]/40 underline-offset-4 transition hover:text-[#2fbf9f] hover:decoration-[#2fbf9f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#06120f] rounded-sm"
            >
              Staff
            </Link>
            <span aria-hidden="true" className="text-white/35">·</span>
            <Link
              href="/login?role=admin"
              className="font-medium text-[#7bd7bd] underline decoration-[#7bd7bd]/40 underline-offset-4 transition hover:text-[#2fbf9f] hover:decoration-[#2fbf9f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#06120f] rounded-sm"
            >
              Admin
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-white/90 sm:text-base">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-center gap-2.5">
                <span
                  className="size-2 rounded-full bg-[#2fbf9f] shadow-[0_0_0_4px_rgba(47,191,159,0.14)]"
                  aria-hidden="true"
                />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-[12px] border border-white/12 bg-[#0b1714]/72 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7bd7bd]">
                  Atomic transfer preview
                </p>
                <p className="mt-1 text-sm text-white/62">Ledger commit simulation</p>
              </div>
              <span className="rounded-[4px] border border-white/12 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
                Sample data
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
              <div className="rounded-[12px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  From
                </p>
                <p className="mt-2 font-heading text-lg font-semibold text-white">Savings</p>
                <p className="mt-1 font-mono text-xs tracking-wide text-white/50">•••• 4829</p>
                <p className="mt-4 font-mono text-lg font-semibold tabular-nums text-[#ff8f8f] sm:text-xl">
                  -৳12,500.00
                </p>
              </div>

              <div className="flex items-center justify-center py-1 sm:py-0" aria-hidden="true">
                <div className="flex size-10 items-center justify-center rounded-full border border-white/12 bg-white/5 text-[#7bd7bd]">
                  <ArrowRight className="size-5 rotate-90 sm:rotate-0" />
                </div>
              </div>

              <div className="rounded-[12px] border border-[#2fbf9f]/20 bg-[#2fbf9f]/[0.06] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  To
                </p>
                <p className="mt-2 font-heading text-lg font-semibold text-white">Current</p>
                <p className="mt-1 font-mono text-xs tracking-wide text-white/50">•••• 7731</p>
                <p className="mt-4 font-mono text-lg font-semibold tabular-nums text-[#6ee7b7] sm:text-xl">
                  +৳12,500.00
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[12px] border border-white/10 bg-black/10 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-xs tracking-wide text-white/72 sm:text-sm">
                  TXN-20261123-8K2M4QX7
                </p>
                <span className="inline-flex items-center rounded-[4px] border border-[#2fbf9f]/30 bg-[#2fbf9f]/12 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7bd7bd]">
                  Completed
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/68">
                Debit and credit are committed together. If any step fails, both
                roll back.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
