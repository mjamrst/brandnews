import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Fast cookie check — no network calls. The client-side AuthProvider
  // handles full token validation, refresh, and redirect to login.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  // Public routes that don't require auth
  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    (request.nextUrl.pathname.startsWith("/newsletters/") &&
      !request.nextUrl.pathname.includes("/edit"));

  if (!hasAuthCookie && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasAuthCookie && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/library";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
