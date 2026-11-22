import { connection } from "next/server";
import { requireRole } from "@/lib/guards";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { staffNav } from "@/components/shared/dashboard-nav";

export const instant = false;

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await requireRole("STAFF", "ADMIN");

  return (
    <DashboardShell
      navItems={staffNav}
      roleLabel="Staff Console"
      user={{ name: user.name, email: user.email }}
    >
      {children}
    </DashboardShell>
  );
}
