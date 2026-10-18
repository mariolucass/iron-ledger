import { requestJson } from "@/shared/api/client";
import type { LoginInput, LoginResponse } from "../model/types";

export const userApi = {
  login: (input: LoginInput) => requestJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  }),
  logout: () => requestJson<{ loggedOut: boolean }>("/api/auth/logout", { method: "POST" }),
};
