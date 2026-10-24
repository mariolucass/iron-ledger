import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";
type Context = { params: Promise<{ section: string; id: string }> };
const path = async ({ params }: Context) => {
  const { section, id } = await params;
  return ["outbox", "feature-flags"].includes(section)
    ? `/platform/${section}/${encodeURIComponent(id)}`
    : null;
};
export async function GET(request: NextRequest, context: Context) {
  const target = await path(context);
  return target
    ? backendRequest(request, target)
    : Response.json({ message: "Seção não encontrada." }, { status: 404 });
}
export async function PATCH(request: NextRequest, context: Context) {
  const target = await path(context);
  return target?.startsWith("/platform/feature-flags/")
    ? backendRequest(request, target, { method: "PATCH", body: await request.text() })
    : Response.json({ message: "Seção não encontrada." }, { status: 404 });
}
