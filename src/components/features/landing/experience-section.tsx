import Link from "next/link";
import { ArrowRight, Shield, User, UserCog } from "lucide-react";

const roles = [
  {
    title: "Customer Persona",
    description: "Sovereign client terminal for everyday banking actions and account visibility.",
    icon: User,
    href: "/login?role=customer",
    cta: "Enter as Customer",
    tone: "bg-landing-primary text-landing-primary-foreground hover:opacity-95",
    iconTone: "bg-landing-primary-soft text-landing-primary",
    points: [
      "Multi-account overview and transfer workflows",
      "Deposit and withdrawal request tracking",
      "Loan application and repayment visibility",
    ],
  },
  {
    title: "Bank Staff Terminal",
    description: "Front-line operations workspace with review and approval controls.",
    icon: Shield,
    href: "/login?role=staff",
    cta: "Enter as Staff",
    tone: "bg-landing-navy text-white hover:opacity-95",
    iconTone: "bg-landing-navy-soft text-landing-navy",
    points: [
      "Pending request and clearing queues",
      "KYC and account support workflows",
      "Role-based safeguards for sensitive actions",
    ],
  },
  {
    title: "Executive Admin",
    description: "Oversight workspace for platform controls, analytics, and audit visibility.",
    icon: UserCog,
    href: "/login?role=admin",
    cta: "Enter as Admin",
    tone: "bg-landing-inverse text-landing-inverse-foreground hover:opacity-95",
    iconTone: "bg-landing-surface-mid text-landing-ink",
    points: [
      "System-level analytics and monitoring",
      "Loan and account management controls",
      "Audit logs and operational oversight",
    ],
  },
];

export function ExperienceSection() {
  return (
    <section id="roles" className="bg-landing-bg py-20 scroll-mt-28" aria-labelledby="experience-heading">
      <div className="landing-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">Select Persona</p>
          <h2 id="experience-heading" className="mt-3 font-heading text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl">
            Choose your experience
          </h2>
          <p className="mt-4 text-base leading-7 text-landing-muted">
            Explore NexaBank through role-based workspaces designed for customers, staff, and administrators.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <article key={role.title} className="flex h-full flex-col rounded-[12px] border border-landing-border bg-landing-surface p-6 shadow-sm">
                <div className={`inline-flex size-12 items-center justify-center rounded-[12px] ${role.iconTone}`}>
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-heading text-2xl font-semibold text-landing-ink">{role.title}</h3>
                <p className="mt-3 text-sm leading-6 text-landing-muted">{role.description}</p>
                <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-landing-ink">
                  {role.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-landing-primary" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={role.href}
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-3 text-sm font-semibold transition ${role.tone}`}
                >
                  {role.cta}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
