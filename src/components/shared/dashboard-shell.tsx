"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
  UserCog,
  Users,
  Wallet,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";

import { ThemeToggle } from "@/components/features/landing/theme-toggle";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  useGetUnreadNotificationCountQuery,
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/store/api/notificationsApi";
import { cn } from "@/lib/utils";
import type { NavGroup, NavIcon, NavItem } from "@/components/shared/dashboard-nav";

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
  navItems?: NavItem[];
  navGroups?: NavGroup[];
  roleLabel: string;
  user: {
    name?: string | null;
    email?: string | null;
  };
};

function useResolvedGroups(navItems?: NavItem[], navGroups?: NavGroup[]) {
  return useMemo<NavGroup[]>(() => {
    if (navGroups?.length) return navGroups;
    if (navItems?.length) return [{ label: "Navigation", items: navItems }];
    return [];
  }, [navItems, navGroups]);
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  groups,
  collapsed,
  onNavigate,
}: {
  groups: NavGroup[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-4 px-3 py-4" aria-label="Dashboard navigation">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          {!collapsed ? (
            <p className="px-3 pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
              {group.label}
            </p>
          ) : (
            <div className="mx-auto my-1 h-px w-8 bg-sidebar-border" aria-hidden="true" />
          )}
          {group.items.map((item) => {
            const Icon = iconMap[item.icon];
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/78 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-[#2FBF9F] transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden="true"
                />
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {!collapsed ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-2")}>
      <Link
        href="/"
        aria-label="NexaBank home"
        className={cn(
          "flex items-center gap-3 overflow-hidden rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          collapsed && "justify-center",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#0E7C66] text-white shadow-sm">
          <Landmark className="size-5" aria-hidden="true" />
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate font-heading text-lg font-bold tracking-tight text-white">
              Nexa<span className="text-[#2FBF9F]">Bank</span>
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/65">Banking workspace</p>
          </div>
        ) : null}
      </Link>
    </div>
  );
}

function UserCard({
  user,
  roleLabel,
  collapsed,
}: {
  user: { name?: string | null; email?: string | null };
  roleLabel: string;
  collapsed: boolean;
}) {
  const name = user.name || user.email || "User";
  const initial = (name.trim()[0] || "U").toUpperCase();
  return (
    <div className={cn("border-t border-sidebar-border p-3", collapsed && "px-2")}>
      <div className={cn("flex items-center gap-3 rounded-[10px] bg-white/[0.04] px-3 py-2.5", collapsed && "justify-center px-0")}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0E7C66]/25 font-heading text-xs font-semibold text-[#7BD7BD]">
          {initial}
        </div>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{name}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">{roleLabel}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SidebarContent({
  groups,
  roleLabel,
  user,
  collapsed,
  onNavigate,
  onToggleCollapse,
  showCollapseToggle,
}: {
  groups: NavGroup[];
  roleLabel: string;
  user: { name?: string | null; email?: string | null };
  collapsed: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <SidebarBrand collapsed={collapsed} />
      <div className="flex-1 overflow-y-auto">
        <NavLinks groups={groups} collapsed={collapsed} onNavigate={onNavigate} />
      </div>
      {showCollapseToggle && onToggleCollapse ? (
        <div className={cn("px-3 pb-2", collapsed && "px-2")}>
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-xs text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              collapsed && "justify-center px-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="size-4" aria-hidden="true" /> : <ChevronLeft className="size-4" aria-hidden="true" />}
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        </div>
      ) : null}
      <UserCard user={user} roleLabel={roleLabel} collapsed={collapsed} />
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
          <Button variant="outline" size="icon" className="relative rounded-[8px]" aria-label="Notifications">
            <Bell className="size-4" aria-hidden="true" />
            {unread > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs font-normal text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => markAllRead()}
              >
                Mark all read
              </button>
            ) : null}
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
                <span className={cn("text-sm font-medium", !n.read && "text-foreground")}>{n.title}</span>
                {!n.read ? <span className="ml-auto size-2 rounded-full bg-primary" aria-hidden="true" /> : null}
              </div>
              <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Breadcrumbs({ pathname, groups }: { pathname: string; groups: NavGroup[] }) {
  const allItems = groups.flatMap((g) => g.items);
  const current = allItems.find((i) => isActive(pathname, i.href));
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="hidden sm:inline">Workspace</span>
        <span className="hidden sm:inline" aria-hidden="true">/</span>
        <span className="truncate font-medium text-foreground">{current?.label ?? "Dashboard"}</span>
      </div>
    </div>
  );
}

export function DashboardShell({ children, navItems, navGroups, roleLabel, user }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const groups = useResolvedGroups(navItems, navGroups);
  const sidebarWidth = collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]";
  const asideWidth = collapsed ? "lg:w-[76px]" : "lg:w-[264px]";

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-md focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-[width] duration-200 lg:block", asideWidth)}>
        <SidebarContent
          groups={groups}
          roleLabel={roleLabel}
          user={user}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          showCollapseToggle
        />
      </aside>

      <div className={cn("transition-[padding] duration-200", sidebarWidth)}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="rounded-[8px] lg:hidden" aria-label="Open menu">
                  <Menu className="size-4" aria-hidden="true" />
                </Button>
              }
            />
            <SheetContent side="left" showCloseButton={false} className="w-[264px] p-0 sm:max-w-[264px]">
              <SidebarContent groups={groups} roleLabel={roleLabel} user={user} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <Breadcrumbs pathname={pathname} groups={groups} />

          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search workspace"
                aria-label="Search workspace"
                className="h-9 w-52 rounded-[8px] border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-[#0E7C66] focus:ring-2 focus:ring-[#0E7C66]/20 lg:w-64"
                readOnly
              />
            </div>
          </div>

          <ThemeToggle className="rounded-[8px] border-border bg-background text-foreground hover:bg-muted" />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="max-w-[140px] justify-between gap-2 rounded-[8px] sm:max-w-[220px]">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0E7C66]/15 font-heading text-[11px] font-semibold text-[#0E7C66]">
                    {(user.name || user.email || "U").trim()[0]?.toUpperCase()}
                  </span>
                  <span className="truncate">{user.name || user.email || "User"}</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="truncate text-sm font-medium">{user.name || "User"}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">{roleLabel}</span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main id="main-content" tabIndex={-1} className="p-4 outline-none sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
