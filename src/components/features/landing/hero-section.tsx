import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { HeroShader } from "./hero-shader";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#06120f] py-16 text-white sm:py-20 lg:py-24" aria-labelledby="hero-heading">
      <HeroShader />
      <div className="landing-container relative grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-[#7bd7bd] backdrop-blur-sm">
            <span className="size-2 rounded-full bg-[#2fbf9f]" aria-hidden="true" />
            Role-based banking simulation
          </div>
          <h1 id="hero-heading" className="mt-6 max-w-3xl font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Banking that moves <span className="text-[#2fbf9f]">as carefully</span> as your money.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
            An institutional-grade digital banking experience for learning and demonstration. Explore accounts, transfers, approvals, and loan workflows with clear role boundaries and transparent sample data.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#demo-credentials"
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#0e7c66] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a6b58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2fbf9f]"
            >
              Explore Demo
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-[8px] border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2fbf9f]"
            >
              Inspect Workflow
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#2fbf9f]" aria-hidden="true" />Server-side authorization</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#2fbf9f]" aria-hidden="true" />Atomic transfer design</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#2fbf9f]" aria-hidden="true" />Role-based access</span>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-[12px] border border-white/12 bg-[#121821]/85 p-5 shadow-2xl backdrop-blur-md sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Institutional Custody</p>
                <p className="mt-1 font-heading text-lg font-semibold text-white">Available Balance</p>
              </div>
              <span className="rounded-[4px] bg-[#2fbf9f]/15 px-2 py-1 text-[11px] font-semibold text-[#7bd7bd]">Sample data</span>
            </div>
            <p className="mt-5 font-heading text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl">
              BDT 4,82,500<span className="text-[#2fbf9f]">.00</span>
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[12px] bg-white/5 p-4">
                <p className="text-xs text-white/55">Primary Checking</p>
                <p className="mt-1 font-mono text-sm text-white">**** **** 4829</p>
              </div>
              <div className="rounded-[12px] bg-white/5 p-4">
                <p className="text-xs text-white/55">Recent transfer</p>
                <p className="mt-1 font-mono text-sm text-white">BDT 12,500.00</p>
              </div>
            </div>
            <div className="mt-4 rounded-[12px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-medium text-white/55">Status</p>
              <p className="mt-1 text-sm font-semibold text-[#7bd7bd]">Transfer completed</p>
              <p className="mt-1 font-mono text-xs text-white/55">Tx #NX-784910 · Sample data</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-white/65">
              <Link href="/login?role=customer" className="underline underline-offset-4 hover:text-[#7bd7bd]">Customer demo</Link>
              <Link href="/login?role=staff" className="underline underline-offset-4 hover:text-[#7bd7bd]">Staff demo</Link>
              <Link href="/login?role=admin" className="underline underline-offset-4 hover:text-[#7bd7bd]">Admin demo</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
