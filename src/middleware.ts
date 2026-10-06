import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import buildAuthConfig from "@/auth.config";

// Deliberately built from the lightweight edge-safe config here, not the
// full "@/auth" (which pulls in the D1 adapter). Middleware only needs to
// check a signed JWT cookie, never the database.
const { auth } = NextAuth(buildAuthConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname, search } = req.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/publish");
  const isLoginRoute = pathname.startsWith("/login");

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/publish/:path*", "/login"],
  runtime: "experimental-edge",
};
