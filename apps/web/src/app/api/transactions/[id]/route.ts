import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return backendRequest(request, `/transactions/${encodeURIComponent(id)}`);
}
