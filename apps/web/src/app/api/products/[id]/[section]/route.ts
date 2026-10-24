import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

type Context = { params: Promise<{ id: string; section: string }> };
const sections = new Set(["inventory", "movements", "lots", "units", "forecast"]);

export async function GET(request: NextRequest, { params }: Context) {
  const { id, section } = await params;
  if (!sections.has(section))
    return Response.json({ message: "Seção não encontrada." }, { status: 404 });
  return backendRequest(request, `/products/${encodeURIComponent(id)}/${section}`);
}
