import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const STAFF_ROLES = [
  "super_admin",
  "admin",
  "store_manager",
  "inventory_manager",
  "marketing_manager",
];

export async function middleware(request: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Protect Admin and Dashboard routes (Staff-only)
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname.startsWith("/auth");
  const isCustomerProtectedRoute =
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/profile");

  if (isAdminRoute || isDashboardRoute) {
    if (!user) {
      // Redirect to login page, preserving the original destination in a redirect query param
      const url = new URL("/auth/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Query user profile for role verification
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !profile || !STAFF_ROLES.includes(profile.role)) {
      // Redirect unauthorized users to the homepage
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isCustomerProtectedRoute) {
    if (!user) {
      const url = new URL("/auth/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (isAuthRoute) {
    if (user) {
      // Redirect logged-in users away from auth pages
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile && STAFF_ROLES.includes(profile.role)) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
