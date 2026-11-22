import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const roleHome: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  STAFF: "/staff/dashboard",
  CUSTOMER: "/customer/dashboard",
};

export default async function Home() {
  await connection();
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role && roleHome[role]) redirect(roleHome[role]);
  redirect("/login");
}
