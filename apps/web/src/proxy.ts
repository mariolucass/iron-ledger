import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, tokenIsUnexpired } from "@/shared/auth/session";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (tokenIsUnexpired(token)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  const response = NextResponse.redirect(loginUrl);
  if (token) response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

export const config = {
  matcher: [
    "/alerts/:path*",
    "/analytics/:path*",
    "/audit-log/:path*",
    "/dashboard/:path*",
    "/design-system/:path*",
    "/forecasting/:path*",
    "/inventory/:path*",
    "/products/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/transactions/:path*",
    "/users/:path*",
    "/warehouses/:path*",
  ],
};
