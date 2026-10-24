import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";
type Context = { params: Promise<{ section: string }> };
const sections = new Set([
  "services",
  "outbox",
  "inbox",
  "idempotency-keys",
  "settings",
  "feature-flags",
]);
export async function GET(request: NextRequest, { params }: Context) {
  const { section } = await params;
  if (!sections.has(section))
    return Response.json({ message: "Seção não encontrada." }, { status: 404 });
  return backendRequest(request, `/platform/${section}`);
}
export async function POST(request: NextRequest, { params }: Context) {
  const { section } = await params;
  if (section !== "feature-flags")
    return Response.json({ message: "Seção não encontrada." }, { status: 404 });
  return backendRequest(request, "/platform/feature-flags", {
    method: "POST",
    body: await request.text(),
  });
}
