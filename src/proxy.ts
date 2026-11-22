import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const roleHome: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  STAFF: "/staff/dashboard",
  CUSTOMER: "/customer/dashboard",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as { role?: string } | undefined;
  const role = user?.role;
  const isAuthPage = pathname.startsWith("/login");
  const isApi = pathname.startsWith("/api");
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/customer") ||
    isApi;

  if (isAuthPage && role) {
    return NextResponse.redirect(new URL(roleHome[role] || "/", req.url));
  }

  if (!user && !isAuthPage && isProtected && !pathname.startsWith("/api/auth")) {
    if (isApi) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (role) {
    const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
    const isStaffArea = pathname.startsWith("/staff") || pathname.startsWith("/api/staff");
    const isCustomerArea = pathname.startsWith("/customer") || pathname.startsWith("/api/customer");

    if (isAdminArea && role !== "ADMIN") {
      if (isApi) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Not authorized" } },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL(roleHome[role] || "/login", req.url));
    }

    if (isStaffArea && role !== "STAFF" && role !== "ADMIN") {
      if (isApi) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Not authorized" } },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL(roleHome[role] || "/login", req.url));
    }

    if (isCustomerArea && role !== "CUSTOMER") {
      if (isApi) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Not authorized" } },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL(roleHome[role] || "/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
