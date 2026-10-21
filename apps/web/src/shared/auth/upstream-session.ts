import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE_NAME, durationInSeconds } from "./session";

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresIn: z.union([z.string(), z.number()]),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    roles: z.array(z.string()),
  }),
});

export const apiUrl = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function upstreamMessage(body: unknown, fallback: string): string {
  return body && typeof body === "object" && "message" in body && typeof body.message === "string"
    ? body.message
    : fallback;
}

/** Validates the API session payload and stores the token in the HTTP-only cookie. */
export function sessionResponse(body: unknown, remember: boolean, status = 200): NextResponse {
  const session = sessionSchema.safeParse(body);
  if (!session.success) {
    return NextResponse.json(
      { error: "INVALID_API_RESPONSE", message: "A API retornou uma sessão inválida." },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ user: session.data.user }, { status });
  response.cookies.set(AUTH_COOKIE_NAME, session.data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: durationInSeconds(session.data.expiresIn) ?? 3_600 } : {}),
  });
  return response;
}
