import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";

export const POST = (request: NextRequest) => backendRequest(request, "/alerts/resolve-all", { method: "POST" });
