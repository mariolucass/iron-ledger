import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> },
) {
  const { section } = await params;
  if (!["sessions", "security", "api-keys"].includes(section))
    return Response.json({ message: "Seção não encontrada." }, { status: 404 });
  return backendRequest(request, `/me/security/${section}`);
}
