import { auth } from "@/auth";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/products",
  "/inventory",
  "/invoices",
  "/purchases",
  "/suppliers",
  "/challans",
  "/accounting",
  "/eway-bill",
  "/reports",
  "/khata",
  "/customers",
  "/settings",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password");

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/products/:path*",
    "/inventory/:path*",
    "/invoices/:path*",
    "/purchases/:path*",
    "/suppliers/:path*",
    "/challans/:path*",
    "/accounting/:path*",
    "/eway-bill/:path*",
    "/reports/:path*",
    "/khata/:path*",
    "/customers/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/forgot-password",
  ],
};
