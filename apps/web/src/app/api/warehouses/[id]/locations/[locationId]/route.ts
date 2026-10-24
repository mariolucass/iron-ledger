import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; locationId: string }> },
) {
  const { id, locationId } = await params;
  return backendRequest(request, `/warehouses/${encodeURIComponent(id)}/locations/${encodeURIComponent(locationId)}`);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; locationId: string }> },
) {
  const { id, locationId } = await params;
  return backendRequest(
    request,
    `/warehouses/${encodeURIComponent(id)}/locations/${encodeURIComponent(locationId)}`,
    { method: "PATCH", body: await request.text() },
  );
}
