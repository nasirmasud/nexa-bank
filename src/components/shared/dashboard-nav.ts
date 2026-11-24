export type NavIcon =
  | "LayoutDashboard"
  | "Users"
  | "Wallet"
  | "ArrowLeftRight"
  | "FileText"
  | "ShieldAlert"
  | "Landmark"
  | "Settings"
  | "Bell"
  | "ClipboardList"
  | "UserCog"
  | "ScrollText"
  | "CreditCard";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const adminNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" }],
  },
  {
    label: "Banking",
    items: [
      { label: "Customers", href: "/admin/customers", icon: "Users" },
      { label: "Accounts", href: "/admin/accounts", icon: "Wallet" },
      { label: "Requests", href: "/admin/requests", icon: "ClipboardList" },
      { label: "Transactions", href: "/admin/transactions", icon: "ArrowLeftRight" },
      { label: "Loans", href: "/admin/loans", icon: "Landmark" },
    ],
  },
  {
    label: "Risk",
    items: [{ label: "Suspicious", href: "/admin/suspicious", icon: "ShieldAlert" }],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: "Settings" },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: "ScrollText" },
    ],
  },
];

export const adminNav: NavItem[] = adminNavGroups.flatMap((g) => g.items);

export const staffNav: NavItem[] = [
  { label: "Dashboard", href: "/staff/dashboard", icon: "LayoutDashboard" },
  { label: "Customers", href: "/staff/customers", icon: "Users" },
  { label: "Accounts", href: "/staff/accounts", icon: "Wallet" },
  { label: "Requests", href: "/staff/requests", icon: "ClipboardList" },
  { label: "Transactions", href: "/staff/transactions", icon: "ArrowLeftRight" },
  { label: "Suspicious", href: "/staff/suspicious", icon: "ShieldAlert" },
  { label: "Loans", href: "/staff/loans", icon: "Landmark" },
];

export const customerNav: NavItem[] = [
  { label: "Dashboard", href: "/customer/dashboard", icon: "LayoutDashboard" },
  { label: "Accounts", href: "/customer/accounts", icon: "Wallet" },
  { label: "Transfer", href: "/customer/transfer", icon: "ArrowLeftRight" },
  { label: "Requests", href: "/customer/requests", icon: "ClipboardList" },
  { label: "Transactions", href: "/customer/transactions", icon: "FileText" },
  { label: "Loans", href: "/customer/loans", icon: "Landmark" },
  { label: "Notifications", href: "/customer/notifications", icon: "Bell" },
  { label: "Settings", href: "/customer/settings", icon: "Settings" },
];
