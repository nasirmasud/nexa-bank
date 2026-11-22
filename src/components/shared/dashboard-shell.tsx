"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  Menu,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  FileText,
  ShieldAlert,
  Landmark,
  Settings,
  Bell,
  ClipboardList,
  UserCog,
  ScrollText,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useGetUnreadNotificationCountQuery,
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/store/api/notificationsApi";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { NavIcon, NavItem } from "@/components/shared/dashboard-nav";

const iconMap: Record<NavIcon, LucideIcon> = {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  FileText,
  ShieldAlert,
  Landmark,
  Settings,
  Bell,
  ClipboardList,
  UserCog,
  ScrollText,
  CreditCard,
};

type DashboardShellProps = {
  children: React.ReactNode;
  navItems: NavItem[];
  roleLabel: string;
  user: {
    name?: string | null;
    email?: string | null;
  };
};

function NavLinks({ navItems, onNavigate }: { navItems: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const Icon = iconMap[item.icon];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  navItems,
  roleLabel,
  onNavigate,
}: {
  navItems: NavItem[];
  roleLabel: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <div>
          <p className="font-heading text-lg font-semibold tracking-tight text-white">NexaBank</p>
          <p className="text-xs text-sidebar-foreground/70">{roleLabel}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavLinks navItems={navItems} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function NotificationBell() {
  const router = useRouter();
  const { data: unreadData } = useGetUnreadNotificationCountQuery();
  const { data: listData } = useListNotificationsQuery({ page: 1, pageSize: 5 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const unread = unreadData?.data.count ?? 0;
  const items = listData?.data ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {unread > 0 && (
              <button
                className="text-xs font-normal text-primary hover:underline"
                onClick={() => markAllRead()}
              >
                Mark all read
              </button>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">No notifications</div>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-1 py-2"
              onClick={async () => {
                if (!n.read) await markRead(n.id);
                if (n.link) router.push(n.link);
              }}
            >
              <div className="flex w-full items-center gap-2">
                <span className={cn("text-sm font-medium", !n.read && "text-foreground")}>
                  {n.title}
                </span>
                {!n.read && <span className="ml-auto size-2 rounded-full bg-primary" />}
              </div>
              <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardShell({ children, navItems, roleLabel, user }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-sidebar-border lg:block">
        <SidebarContent navItems={navItems} roleLabel={roleLabel} />
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card px-4 sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              }
            />
            <SheetContent
              side="left"
              showCloseButton={false}
              className="w-[264px] p-0 sm:max-w-[264px]"
            >
              <SidebarContent
                navItems={navItems}
                roleLabel={roleLabel}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-muted-foreground">{roleLabel}</p>
          </div>

          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  className="max-w-[140px] justify-between gap-2 sm:max-w-[220px]"
                >
                  <span className="truncate">{user.name || user.email || "User"}</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="truncate text-sm font-medium">{user.name || "User"}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
