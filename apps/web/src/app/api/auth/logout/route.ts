import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/shared/auth/session";

export async function POST() {
  const response = NextResponse.json({ loggedOut: true });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
