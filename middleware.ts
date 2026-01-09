import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function middleware(req: any) {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // API routes for authentication
  const isAuthApiRoute = pathname.startsWith("/api/auth") || pathname.startsWith("/api/register");

  // If trying to access protected route without authentication
  if (!isPublicRoute && !isAuthApiRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login/register, redirect to dashboard
  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Role-based route protection
  if (isLoggedIn && session?.user) {
    const userRole = session.user.role;

    // Admin-only routes
    if (pathname.startsWith("/dashboard/admin")) {
      if (userRole !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Team management routes (team leads and admins only)
    if (
      pathname.startsWith("/dashboard/teams/new") ||
      pathname.includes("/manage")
    ) {
      if (userRole !== "admin" && userRole !== "team_lead") {
        return NextResponse.redirect(new URL("/dashboard/teams", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
  runtime: 'nodejs',
};
