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
    path.startsWith("/tools") ||
    path.startsWith("/terms") ||
    path.startsWith("/privacy") ||
    path.startsWith("/verify-email") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/accept-invite") ||
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
    path.startsWith("/auth") ||
    path.startsWith("/accept-invite");

  // Protect all app routes except public pages and API routes
  if (!user && !isPublicPage && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    const orgCookie = request.cookies.get("current_org_id")?.value;
    const url = request.nextUrl.clone();
    url.pathname = orgCookie ? "/dashboard" : "/workspaces";
    return NextResponse.redirect(url);
  }

  // Detect user switch: clear stale org cookie when a different user signs in
  if (user?.id) {
    const lastUid = request.cookies.get("_last_uid")?.value;
    if (lastUid && lastUid !== user.id) {
      // User changed — clear stale org cookie and redirect to workspaces
      const url = request.nextUrl.clone();
      url.pathname = "/workspaces";
      const response = NextResponse.redirect(url);
      response.cookies.delete("current_org_id");
      response.cookies.set("_last_uid", user.id, { path: "/", httpOnly: false, maxAge: 60 * 60 * 24 * 365 });
      return response;
    }
    if (!lastUid) {
      // First visit — stamp the user ID
      const response = NextResponse.next({
        request: { headers: new Headers(request.headers) },
      });
      response.headers.set("x-pathname", path);
      response.cookies.set("_last_uid", user.id, { path: "/", httpOnly: false, maxAge: 60 * 60 * 24 * 365 });
      // Also check org cookie for this first visit
      const orgCookie = request.cookies.get("current_org_id")?.value;
      if (!orgCookie && !isPublicPage && !isApiRoute && !isOnboardingAllowed) {
        const url = request.nextUrl.clone();
        url.pathname = "/workspaces";
        const redirectResponse = NextResponse.redirect(url);
        redirectResponse.cookies.set("_last_uid", user.id, { path: "/", httpOnly: false, maxAge: 60 * 60 * 24 * 365 });
        return redirectResponse;
      }
      return response;
    }
  }

  // Enforce org selection: auth'd user without org cookie → /workspaces
  if (user && !isPublicPage && !isApiRoute && !isOnboardingAllowed) {
    const orgCookie = request.cookies.get("current_org_id")?.value;
    if (!orgCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/workspaces";
      return NextResponse.redirect(url);
    }
  }

  // Pass pathname to server components via request header
  const response = NextResponse.next({
    request: { headers: new Headers(request.headers) },
  });
  response.headers.set("x-pathname", path);
  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)",
  ],
};
