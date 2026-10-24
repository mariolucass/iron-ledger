import { requestJson, withQuery, type PaginatedResponse } from "@/shared/api/client";
import type {
  ChangePasswordInput,
  CreateUserInput,
  LoginInput,
  LoginResponse,
  Preferences,
  PreferencesPatch,
  Profile,
  RegisterInput,
  RoleSummary,
  UpdateProfileInput,
  UpdateUserInput,
  UserDetail,
  UserQuery,
  UserSummary,
  UserWarehouseAccess,
  UserSessionInfo,
  UserSecurityInfo,
  UserApiKeyInfo,
  PermissionInfo,
  RoleDetail,
  RoleMember,
  InvitationInfo,
  RoleInput,
} from "../model/types";

export const userApi = {
  login: (input: LoginInput) =>
    requestJson<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  register: (input: RegisterInput) =>
    requestJson<LoginResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  me: () => requestJson<Profile>("/api/me"),
  mySessions: () => requestJson<UserSessionInfo[]>("/api/me/security/sessions"),
  mySecurity: () => requestJson<UserSecurityInfo>("/api/me/security/security"),
  myApiKeys: () => requestJson<UserApiKeyInfo[]>("/api/me/security/api-keys"),
  updateMe: (input: UpdateProfileInput) =>
    requestJson<Profile>("/api/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  updatePreferences: (patch: PreferencesPatch) =>
    requestJson<Preferences>("/api/me/preferences", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  changePassword: (input: ChangePasswordInput) =>
    requestJson<{ changed: true }>("/api/me/password", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  logout: () => requestJson<{ loggedOut: boolean }>("/api/auth/logout", { method: "POST" }),
  // Administração de acesso (exige papel ADMIN)
  list: (query: UserQuery = {}) =>
    requestJson<PaginatedResponse<UserSummary>>(withQuery("/api/users", query)),
  get: (id: string) => requestJson<UserDetail>(`/api/users/${encodeURIComponent(id)}`),
  create: (input: CreateUserInput) =>
    requestJson<UserDetail>("/api/users", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: UpdateUserInput) =>
    requestJson<UserDetail>(`/api/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  setRoles: (id: string, roles: string[]) =>
    requestJson<UserDetail>(`/api/users/${encodeURIComponent(id)}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roles }),
    }),
  listRoles: () => requestJson<{ items: RoleSummary[] }>("/api/roles"),
  warehouses: (id: string) =>
    requestJson<UserWarehouseAccess[]>(`/api/users/${encodeURIComponent(id)}/warehouses`),
  sessions: (id: string) =>
    requestJson<UserSessionInfo[]>(`/api/users/${encodeURIComponent(id)}/sessions`),
  security: (id: string) =>
    requestJson<UserSecurityInfo>(`/api/users/${encodeURIComponent(id)}/security`),
  apiKeys: (id: string) =>
    requestJson<UserApiKeyInfo[]>(`/api/users/${encodeURIComponent(id)}/api-keys`),
  invitations: () => requestJson<InvitationInfo[]>("/api/users/invitations"),
  permissions: () => requestJson<PermissionInfo[]>("/api/roles/permissions"),
  role: (id: string) => requestJson<RoleDetail>(`/api/roles/${encodeURIComponent(id)}`),
  rolePermissions: (id: string) =>
    requestJson<PermissionInfo[]>(`/api/roles/${encodeURIComponent(id)}/permissions`),
  roleMembers: (id: string) =>
    requestJson<RoleMember[]>(`/api/roles/${encodeURIComponent(id)}/members`),
  createRole: (input: RoleInput) =>
    requestJson<RoleDetail>("/api/roles", { method: "POST", body: JSON.stringify(input) }),
  updateRole: (id: string, input: RoleInput) =>
    requestJson<RoleDetail>(`/api/roles/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};
