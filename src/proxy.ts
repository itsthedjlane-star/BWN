import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const pathname = req.nextUrl.pathname;

  // Not authenticated — redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const isAdmin = token.role === "ADMIN";
  const isApproved = token.approved === true;

  // Admin-only routes
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/odds", req.url));
  }

  // Unapproved users can only access /register
  if (!isApproved && !pathname.startsWith("/register")) {
    return NextResponse.redirect(new URL("/register?pending=true", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/odds/:path*",
    "/tips/:path*",
    "/tipsters/:path*",
    "/tracker/:path*",
    "/strategies/:path*",
    "/matches/:path*",
    "/racing/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/register",
  ],
};
