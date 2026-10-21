import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return backendRequest(request, `/users/${encodeURIComponent(id)}/roles`, {
    method: "PUT",
    body: await request.text(),
  });
}
