import { requireRole } from "@/lib/guards";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { customerNav } from "@/components/shared/dashboard-nav";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CUSTOMER");

  return (
    <DashboardShell
      navItems={customerNav}
      roleLabel="Customer Banking"
      user={{ name: user.name, email: user.email }}
    >
      {children}
    </DashboardShell>
  );
}
