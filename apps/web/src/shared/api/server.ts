import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/shared/auth/session";
import { apiUrl } from "@/shared/auth/upstream-session";
import { ApiError } from "./client";

/** Server Components call the operational API directly, without a loopback through /api. */
export async function serverRequestJson<T>(path: string): Promise<T> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) redirect("/login");

  let response: Response;
  try {
    response = await fetch(new URL(path, apiUrl()), {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new ApiError("A API operacional está indisponível.", 503, "API_UNAVAILABLE");
  }

  if (response.status === 401) redirect("/login");
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const details =
      body && typeof body === "object" ? (body as { message?: unknown; error?: unknown }) : null;
    throw new ApiError(
      typeof details?.message === "string" ? details.message : "Não foi possível consultar a API.",
      response.status,
      typeof details?.error === "string" ? details.error : undefined,
    );
  }
  return response.json() as Promise<T>;
}
