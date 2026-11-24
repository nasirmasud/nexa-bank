import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { AppError } from "@/lib/errors";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { adminNavGroups } from "@/components/shared/dashboard-nav";

export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  let user;
  try {
    user = await requireRole("ADMIN");
  } catch (e) {
    if (e instanceof AppError && e.code === "UNAUTHORIZED") redirect("/login?sessionExpired=1");
    if (e instanceof AppError && e.code === "FORBIDDEN") redirect("/");
    throw e;
  }

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
