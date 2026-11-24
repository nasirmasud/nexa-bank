"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getRoleHome } from "@/lib/role-home";

const navItems = [
  { href: "#features", label: "Features" },
  { href: "#security", label: "Security" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#roles", label: "Roles" },
  { href: "#faq", label: "FAQ" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const dashboardHref = getRoleHome(role);
  const isLoggedIn = status === "authenticated" && !!dashboardHref;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="border-landing-border bg-landing-surface text-landing-ink hover:bg-landing-surface-mid lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
        }
      />
      <SheetContent side="right" className="w-[300px] bg-landing-surface p-0 sm:max-w-[340px]">
        <SheetHeader className="border-b border-landing-border px-5 py-4">
          <SheetTitle className="font-heading text-lg font-semibold text-landing-ink">NexaBank</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-[8px] px-3 py-2.5 text-sm font-medium text-landing-ink transition hover:bg-landing-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary"
            >
              {item.label}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-2 border-t border-landing-border pt-4">
            {isLoggedIn ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setOpen(false)}
                  className="rounded-[8px] bg-landing-primary px-3 py-2.5 text-center text-sm font-semibold text-landing-primary-foreground hover:opacity-95"
                >
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void signOut({ callbackUrl: "/" });
                  }}
                  className="rounded-[8px] border border-landing-border px-3 py-2.5 text-center text-sm font-semibold text-landing-ink hover:bg-landing-surface-low"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-[8px] border border-landing-border px-3 py-2.5 text-center text-sm font-semibold text-landing-ink hover:bg-landing-surface-low"
                >
                  Login
                </Link>
                <a
                  href="#demo-credentials"
                  onClick={() => setOpen(false)}
                  className="rounded-[8px] bg-landing-primary px-3 py-2.5 text-center text-sm font-semibold text-landing-primary-foreground hover:opacity-95"
                >
                  Explore Demo
                </a>
              </>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
