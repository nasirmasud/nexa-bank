import { connection } from "next/server";
import { requireRole } from "@/lib/guards";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { adminNavGroups } from "@/components/shared/dashboard-nav";

export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await requireRole("ADMIN");

  return (
    <DashboardShell
      navGroups={adminNavGroups}
      roleLabel="Admin Console"
      user={{ name: user.name, email: user.email }}
    >
      {children}
    </DashboardShell>
  );
}
