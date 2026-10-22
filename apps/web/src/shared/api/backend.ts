import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/shared/auth/session";

const apiUrl = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function backendRequest(
  request: NextRequest,
  pathname: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Sessão ausente." },
      { status: 401 },
    );
  }

  const url = new URL(pathname, apiUrl());
  url.search = request.nextUrl.search;
  try {
    const upstream = await fetch(url, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(request.headers.get("x-correlation-id")
          ? { "x-correlation-id": request.headers.get("x-correlation-id")! }
          : {}),
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const response = new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
    const correlationId = upstream.headers.get("x-correlation-id");
    if (correlationId) response.headers.set("x-correlation-id", correlationId);
    if (upstream.status === 401) response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  } catch {
    return NextResponse.json(
      { error: "API_UNAVAILABLE", message: "A API operacional está indisponível." },
      { status: 503 },
    );
  }
}
