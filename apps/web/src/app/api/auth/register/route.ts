import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUrl, sessionResponse, upstreamMessage } from "@/shared/auth/upstream-session";

const requestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const input = requestSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "Revise nome, e-mail e senha (mínimo de 8 caracteres)." },
      { status: 422 },
    );
  }

  try {
    const upstream = await fetch(new URL("/auth/register", apiUrl()), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input.data),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const body: unknown = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const message = upstreamMessage(body, "Não foi possível concluir o cadastro.");
      const code =
        body && typeof body === "object" && "error" in body && typeof body.error === "string"
          ? body.error
          : "REGISTRATION_FAILED";
      const status = upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502;
      return NextResponse.json({ error: code, message }, { status });
    }

    return sessionResponse(body, true, 201);
  } catch {
    return NextResponse.json(
      { error: "API_UNAVAILABLE", message: "A API de autenticação está indisponível. Tente novamente." },
      { status: 503 },
    );
  }
}
