import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Auth sessions live in localStorage (client-side only).
  // The client-side AuthProvider + DashboardLayout handle auth gating
  // and redirect to /login when unauthenticated. The proxy just
  // passes requests through with no blocking network calls.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
