import Link from "next/link";
import { Copy, Eye, ShieldAlert } from "lucide-react";

const demos = [
  { role: "Admin", email: "admin@nexabank.com", password: "Password@123", href: "/login?role=admin" },
  { role: "Staff", email: "staff1@nexabank.com", password: "Password@123", href: "/login?role=staff" },
  { role: "Customer", email: "customer1@nexabank.com", password: "Password@123", href: "/login?role=customer" },
];

export function DemoCredentialsSection() {
  return (
    <section id="demo-credentials" className="bg-landing-bg py-20 scroll-mt-28" aria-labelledby="demo-credentials-heading">
      <div className="landing-container">
        <div className="rounded-[12px] border border-landing-warning/30 bg-landing-warning/10 p-4 text-sm text-landing-ink">
          <p className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-landing-warning" aria-hidden="true" />
            <span><span className="font-semibold">Simulator Environment Notice:</span> For simulation only. Do not enter real personal or banking data.</span>
          </p>
        </div>

        <div className="mt-8 max-w-3xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">Instant Testing</p>
          <h2 id="demo-credentials-heading" className="mt-3 font-heading text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl">
            Demo credentials
          </h2>
          <p className="mt-4 text-base leading-7 text-landing-muted">
            Use these seeded demo accounts to explore role-based workflows. Interactive copy/show-hide will be enabled in a later step.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {demos.map((demo) => (
            <article key={demo.role} className="flex flex-col gap-4 rounded-[12px] border border-landing-border bg-landing-surface p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-heading text-xl font-semibold text-landing-ink">{demo.role}</p>
                <p className="mt-1 font-mono text-sm text-landing-muted">{demo.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-[8px] border border-landing-border bg-landing-surface-low px-3 py-2 font-mono text-sm text-landing-ink">
                  <span>{demo.password}</span>
                  <button type="button" aria-label={`Show or hide ${demo.role} password`} className="text-landing-muted hover:text-landing-primary">
                    <Eye className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <button type="button" aria-label={`Copy ${demo.role} credentials`} className="inline-flex items-center gap-2 rounded-[8px] border border-landing-border bg-landing-surface px-3 py-2 text-sm font-medium text-landing-ink hover:bg-landing-surface-mid">
                  <Copy className="size-4" aria-hidden="true" /> Copy
                </button>
                <Link href={demo.href} className="inline-flex items-center rounded-[8px] bg-landing-primary px-4 py-2 text-sm font-semibold text-landing-primary-foreground hover:opacity-95">
                  Login as {demo.role}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
