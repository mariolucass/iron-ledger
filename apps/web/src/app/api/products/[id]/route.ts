import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

type Context = { params: Promise<{ id: string }> };

const path = async ({ params }: Context) => `/products/${encodeURIComponent((await params).id)}`;

export async function GET(request: NextRequest, context: Context) {
  return backendRequest(request, await path(context));
}

export async function PATCH(request: NextRequest, context: Context) {
  return backendRequest(request, await path(context), { method: "PATCH", body: await request.text() });
}

export async function DELETE(request: NextRequest, context: Context) {
  return backendRequest(request, await path(context), { method: "DELETE" });
}
