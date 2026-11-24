import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { AppError } from "@/lib/errors";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { customerNav } from "@/components/shared/dashboard-nav";

export const instant = false;

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  await connection();
  let user;
  try {
    user = await requireRole("CUSTOMER");
  } catch (e) {
    if (e instanceof AppError && e.code === "UNAUTHORIZED") redirect("/login?sessionExpired=1");
    if (e instanceof AppError && e.code === "FORBIDDEN") redirect("/");
    if (e instanceof AppError && e.code === "PASSWORD_CHANGE_REQUIRED") redirect("/change-password");
    throw e;
  }

  if (user.mustChangePassword) redirect("/change-password");

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
