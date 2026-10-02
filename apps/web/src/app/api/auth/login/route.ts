import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE_NAME, durationInSeconds } from "@/shared/auth/session";

const requestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  remember: z.boolean().default(false),
});

const responseSchema = z.object({
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

const apiUrl = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  const input = requestSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "Informe um e-mail e uma senha válidos." },
      { status: 422 },
    );
  }

  try {
    const upstream = await fetch(new URL("/auth/login", apiUrl()), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: input.data.email, password: input.data.password }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    const body: unknown = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const message =
        body && typeof body === "object" && "message" in body && typeof body.message === "string"
          ? body.message
          : "Não foi possível autenticar com essas credenciais.";
      const status = upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502;
      return NextResponse.json({ error: "AUTHENTICATION_FAILED", message }, { status });
    }

    const session = responseSchema.safeParse(body);
    if (!session.success) {
      return NextResponse.json(
        { error: "INVALID_API_RESPONSE", message: "A API retornou uma sessão inválida." },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ user: session.data.user });
    response.cookies.set(AUTH_COOKIE_NAME, session.data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(input.data.remember
        ? { maxAge: durationInSeconds(session.data.expiresIn) ?? 3_600 }
        : {}),
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "API_UNAVAILABLE", message: "A API de autenticação está indisponível. Tente novamente." },
      { status: 503 },
    );
  }
}
