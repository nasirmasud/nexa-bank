import Link from "next/link";
import { MoonStar } from "lucide-react";
import { LandingLogo } from "./landing-logo";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10Z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM6.814 20.452H3.86V9h2.954v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Features", href: "#features" },
      { label: "Security", href: "#security" },
      { label: "How it works", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Roles",
    links: [
      { label: "Customer", href: "/login?role=customer" },
      { label: "Staff", href: "/login?role=staff" },
      { label: "Admin", href: "/login?role=admin" },
      { label: "Demo credentials", href: "#demo-credentials" },
    ],
  },
  {
    title: "Legal & Notice",
    links: [
      { label: "Simulation notice", href: "#demo-credentials" },
      { label: "Login", href: "/login" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative bg-[#06120f] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,18,15,0.92),rgba(6,18,15,0.96))]" aria-hidden="true" />
      <div className="landing-container relative py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <LandingLogo className="[&_span]:text-white [&_.text-landing-primary]:text-[#2fbf9f]" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/72">
              NexaBank is a simulated digital banking platform for demonstrating role-based workflows, transaction visibility, and operational controls.
            </p>
            <p className="mt-4 text-sm font-medium text-[#2fbf9f]">Simulated environment. No real money involved.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-white">{col.title}</h3>
                <ul className="mt-4 space-y-3 text-sm text-white/72">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("/") ? (
                        <Link href={link.href} className="transition hover:text-white">{link.label}</Link>
                      ) : (
                        <a href={link.href} className="transition hover:text-white">{link.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/68">© 2026 NexaBank. Simulated banking system, not a real financial institution.</p>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/nasirmasud/nexa-bank"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="inline-flex size-10 items-center justify-center rounded-[8px] border border-white/15 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <GitHubIcon className="size-4" />
            </a>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="inline-flex size-10 items-center justify-center rounded-[8px] border border-white/15 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <LinkedInIcon className="size-4" />
            </a>
            <button
              type="button"
              aria-label="Toggle theme"
              className="inline-flex size-10 items-center justify-center rounded-[8px] border border-white/15 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <MoonStar className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
