import { NextResponse } from "next/server";
import { z } from "zod";
import { forwardedHeaders, retryAfterHeaders } from "@/shared/api/forwarded-headers";
import { apiUrl, sessionResponse, upstreamMessage } from "@/shared/auth/upstream-session";

const requestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  remember: z.boolean().default(false),
});

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
      headers: { "content-type": "application/json", ...forwardedHeaders(request) },
      body: JSON.stringify({ email: input.data.email, password: input.data.password }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    const body: unknown = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const message = upstreamMessage(body, "Não foi possível autenticar com essas credenciais.");
      const status = upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502;
      return NextResponse.json(
        { error: "AUTHENTICATION_FAILED", message },
        { status, headers: retryAfterHeaders(upstream) },
      );
    }

    return sessionResponse(body, input.data.remember);
  } catch {
    return NextResponse.json(
      {
        error: "API_UNAVAILABLE",
        message: "A API de autenticação está indisponível. Tente novamente.",
      },
      { status: 503 },
    );
  }
}
