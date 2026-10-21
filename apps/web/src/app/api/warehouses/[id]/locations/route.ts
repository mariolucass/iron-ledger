import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return backendRequest(request, `/warehouses/${encodeURIComponent(id)}/locations`, {
    method: "POST",
    body: await request.text(),
  });
}
