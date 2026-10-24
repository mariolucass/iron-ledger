import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

export const GET = (request: NextRequest) => backendRequest(request, "/roles");

export async function POST(request: NextRequest) {
  return backendRequest(request, "/roles", { method: "POST", body: await request.text() });
}
