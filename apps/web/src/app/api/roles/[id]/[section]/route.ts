import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";
type Context = { params: Promise<{ id: string; section: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  const { id, section } = await params;
  if (!new Set(["permissions", "members"]).has(section))
    return Response.json({ message: "Seção não encontrada." }, { status: 404 });
  return backendRequest(request, `/roles/${encodeURIComponent(id)}/${section}`);
}
