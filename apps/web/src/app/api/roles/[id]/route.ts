import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;

  return backendRequest(request, `/roles/${encodeURIComponent(id)}`);
}
export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return backendRequest(request, `/roles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: await request.text(),
  });
}
