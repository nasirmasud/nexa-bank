import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const roleHome: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  STAFF: "/staff/dashboard",
  CUSTOMER: "/customer/dashboard",
};

export default async function Home() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role && roleHome[role]) redirect(roleHome[role]);
  redirect("/login");
}
