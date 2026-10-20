import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ stockLevelId: string }> },
) {
  const { stockLevelId } = await context.params;
  return backendRequest(request, `/inventory/${encodeURIComponent(stockLevelId)}/movements`);
}
