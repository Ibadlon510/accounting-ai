import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default auth(async function middleware(request) {
  const session = (request as unknown as { auth: { user?: { id?: string } } | null }).auth;
  const user = session?.user;
  const path = request.nextUrl.pathname;

  const isPublicPage =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/landing") ||
    path.startsWith("/verify-email") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/auth");

  const isAuthPage =
    path.startsWith("/login") ||
    path.startsWith("/signup");

  const isApiRoute = path.startsWith("/api");

  const isOnboardingAllowed =
    path.startsWith("/onboarding") ||
    path.startsWith("/workspaces") ||
    path.startsWith("/verify-email") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/auth");

  // Protect all app routes except public pages and API routes
  if (!user && !isPublicPage && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Enforce onboarding: auth'd user without org cookie → /onboarding
  if (user && !isPublicPage && !isApiRoute && !isOnboardingAllowed) {
    const orgCookie = request.cookies.get("current_org_id")?.value;
    if (!orgCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
