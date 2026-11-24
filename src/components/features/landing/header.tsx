"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { getRoleHome } from "@/lib/role-home";
import { LandingLogo } from "./landing-logo";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "#features", label: "Features" },
  { href: "#security", label: "Security" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#roles", label: "Roles" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const dashboardHref = getRoleHome(role);
  const isLoggedIn = status === "authenticated" && !!dashboardHref;

  return (
    <header className="sticky top-0 z-50 border-b border-landing-border/80 bg-landing-bg/90 backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[8px] focus:bg-landing-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-landing-ink focus:shadow-md focus:ring-2 focus:ring-landing-primary"
      >
        Skip to content
      </a>
      <div className="landing-container flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="NexaBank home" className="shrink-0">
          <LandingLogo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-[8px] px-3 py-2 text-sm font-medium text-landing-muted transition hover:bg-landing-surface-mid hover:text-landing-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="border-landing-border bg-landing-surface text-landing-ink hover:bg-landing-surface-mid" />
          {isLoggedIn ? (
            <>
              <Link
                href={dashboardHref}
                className="hidden rounded-[8px] bg-landing-primary px-4 py-2 text-sm font-semibold text-landing-primary-foreground transition hover:opacity-95 sm:inline-flex"
              >
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden rounded-[8px] px-3 py-2 text-sm font-semibold text-landing-ink transition hover:bg-landing-surface-mid sm:inline-flex"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-[8px] px-3 py-2 text-sm font-semibold text-landing-ink transition hover:bg-landing-surface-mid sm:inline-flex"
              >
                Login
              </Link>
              <a
                href="#demo-credentials"
                className="hidden rounded-[8px] bg-landing-primary px-4 py-2 text-sm font-semibold text-landing-primary-foreground transition hover:opacity-95 sm:inline-flex"
              >
                Explore Demo
              </a>
            </>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
