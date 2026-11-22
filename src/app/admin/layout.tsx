import { requireRole } from "@/lib/guards";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { adminNav } from "@/components/shared/dashboard-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN");

  return (
    <DashboardShell
      navItems={adminNav}
      roleLabel="Admin Console"
      user={{ name: user.name, email: user.email }}
    >
      {children}
    </DashboardShell>
  );
}
