import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoleHome } from "@/lib/role-home";
import { LandingPage } from "@/components/features/landing/landing-page";

export const instant = false;

export default async function Home() {
  await connection();
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const home = getRoleHome(role);
  if (home) redirect(home);
  return <LandingPage />;
}
