import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/guards";
import { AppError } from "@/lib/errors";
import { ChangePasswordForm } from "./change-password-form";

export const instant = false;

function roleDashboard(role: string) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "STAFF") return "/staff/dashboard";
  return "/customer/dashboard";
}

export default async function ChangePasswordPage() {
  await connection();
  let user;
  try {
    user = await requireAuth({ allowPasswordChangeRequired: true });
  } catch (e) {
    if (e instanceof AppError && e.code === "UNAUTHORIZED") redirect("/login?sessionExpired=1");
    throw e;
  }

  if (!user.mustChangePassword) {
    redirect(roleDashboard(user.role));
  }

  return (
    <ChangePasswordForm
      email={user.email}
      name={user.name}
      role={user.role}
    />
  );
}
