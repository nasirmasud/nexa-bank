import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="bg-landing-inverse py-24 sm:py-28 lg:py-32 text-landing-inverse-foreground" aria-labelledby="final-cta-heading">
      <div className="landing-container text-center">
        <h2 id="final-cta-heading" className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          See NexaBank in action
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-landing-inverse-foreground/80">
          Step into a simulated banking environment with role-based workflows, clear transaction states, and sample operational data.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="#demo-credentials" className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-landing-primary px-5 py-3 text-sm font-semibold text-landing-primary-foreground hover:opacity-95">
            Open Demo Credentials
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <Link href="/login" className="inline-flex items-center justify-center rounded-[8px] border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Go to Login
          </Link>
        </div>
      </div>
    </section>
  );
}
