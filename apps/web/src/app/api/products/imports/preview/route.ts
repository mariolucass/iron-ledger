import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

/** Planilhas grandes passam do timeout padrão do BFF. */
export async function POST(request: NextRequest) {
  return backendRequest(request, "/products/imports/preview", {
    method: "POST",
    body: await request.text(),
    signal: AbortSignal.timeout(120_000),
  });
}
