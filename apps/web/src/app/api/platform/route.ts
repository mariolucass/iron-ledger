import type { NextRequest } from "next/server";
import { backendRequest } from "@/shared/api/backend";
export const GET = (request: NextRequest) => backendRequest(request, "/platform");
