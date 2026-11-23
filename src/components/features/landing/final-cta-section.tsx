import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MosaicShaderBackground from "@/components/ui/mosaic-shader-background";

export function FinalCtaSection() {
  return (
    <section
      className="relative overflow-hidden py-24 text-white sm:py-28 lg:py-32"
      aria-labelledby="final-cta-heading"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <MosaicShaderBackground
          scene="prism"
          accent="ice"
          interactive={false}
          height="100%"
          className="h-full w-full"
        />
      </div>
      <div className="landing-container relative z-10 text-center">
        <h2
          id="final-cta-heading"
          className="font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          See NexaBank in action
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/80">
          Step into a simulated banking environment with role-based workflows,
          clear transaction states, and sample operational data.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#demo-credentials"
            className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-landing-primary px-5 py-3 text-sm font-semibold text-landing-primary-foreground transition hover:bg-landing-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1420]"
          >
            Open Demo Credentials
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-[8px] border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1420]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </section>
  );
}
