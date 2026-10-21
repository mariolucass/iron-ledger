import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

export const GET = (request: NextRequest) => backendRequest(request, "/me");

export async function PATCH(request: NextRequest) {
  return backendRequest(request, "/me", { method: "PATCH", body: await request.text() });
}
