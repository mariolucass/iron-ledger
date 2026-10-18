import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

export async function GET(request: NextRequest) {
  return backendRequest(request, "/transactions");
}

export async function POST(request: NextRequest) {
  const idempotencyKey = request.headers.get("idempotency-key");
  return backendRequest(request, "/transactions", {
    method: "POST",
    body: await request.text(),
    headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : undefined,
  });
}
