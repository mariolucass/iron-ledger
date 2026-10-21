import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

export async function PATCH(request: NextRequest) {
  return backendRequest(request, "/me/preferences", { method: "PATCH", body: await request.text() });
}
