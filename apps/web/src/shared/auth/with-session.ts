import { ApiError } from "@/shared/api/client";

/** Keep session navigation in the application adapter, outside entity clients. */
export async function withSession<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && typeof window !== "undefined") {
      window.location.assign("/login");
      throw new Error("Sessão expirada.");
    }
    throw error;
  }
}
