import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

export async function POST(request: NextRequest) {
  return backendRequest(request, "/me/password", { method: "POST", body: await request.text() });
}
