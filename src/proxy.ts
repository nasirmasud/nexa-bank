import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const roleHome: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  STAFF: "/staff/dashboard",
  CUSTOMER: "/customer/dashboard",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as any;
  const isAuthPage = pathname.startsWith("/login");
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/customer") ||
    pathname.startsWith("/api");

  if (isAuthPage && user?.role) {
    return NextResponse.redirect(new URL(roleHome[user.role] || "/", req.url));
  }

  if (!user && !isAuthPage && isProtected && !pathname.startsWith("/api/auth")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (user?.role) {
    if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL(roleHome[user.role] || "/login", req.url));
    }
    if (pathname.startsWith("/staff") && user.role !== "STAFF" && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL(roleHome[user.role] || "/login", req.url));
    }
    if (pathname.startsWith("/customer") && user.role !== "CUSTOMER") {
      return NextResponse.redirect(new URL(roleHome[user.role] || "/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
