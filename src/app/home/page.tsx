import { connection } from "next/server";
import { LandingPage } from "@/components/features/landing/landing-page";

export const instant = false;

export default async function HomePage() {
  await connection();
  return <LandingPage />;
}
