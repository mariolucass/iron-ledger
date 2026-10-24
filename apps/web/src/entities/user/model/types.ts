import type { PaginationQuery } from "@/shared/api/client";

/** Public user returned by POST /auth/login. Credentials and password hashes are not entity data. */
export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface LoginInput {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/** The BFF stores the upstream access token and only returns the public user. */
export interface LoginResponse {
  user: User;
}

export interface Preferences {
  notifications: { emailAlerts: boolean; slackAlerts: boolean };
  security: { strictIp: boolean; allowedIps: string[] };
}

export interface PreferencesPatch {
  notifications?: Partial<Preferences["notifications"]>;
  security?: Partial<Preferences["security"]>;
}

/** Authenticated user's own profile (GET /me). */
export interface Profile extends User {
  avatarUrl: string | null;
  locale: string;
  timezone: string;
  preferences: Preferences;
}

export interface UpdateProfileInput {
  name?: string;
  avatarUrl?: string | null;
  locale?: string;
  timezone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const USER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Read model returned by GET /users (administration). */
export interface UserSummary {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  roles: string[];
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface RoleGrant {
  name: string;
  grantedAt: string;
  expiresAt: string | null;
}

/** Read model returned by GET /users/:id. */
export interface UserDetail extends Omit<UserSummary, "roles"> {
  roles: RoleGrant[];
  emailVerifiedAt: string | null;
  updatedAt: string;
}

export interface RoleSummary {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
}

export interface UserQuery extends PaginationQuery {
  q?: string;
  status?: UserStatus;
  role?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roles: string[];
}

export interface UpdateUserInput {
  name?: string;
  status?: UserStatus;
}

export interface UserWarehouseAccess {
  warehouseId: string;
  code: string;
  name: string;
  isActive: boolean;
  accessLevel: string;
  grantedAt: string;
  expiresAt: string | null;
}
export interface UserSessionInfo {
  id: string;
  status: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}
export interface UserSecurityInfo {
  mfaEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  passwordChangedAt: string | null;
  externalId: string | null;
  factors: {
    id: string;
    method: string;
    label: string | null;
    verifiedAt: string | null;
    lastUsedAt: string | null;
    createdAt: string;
  }[];
  identities: {
    id: string;
    provider: string;
    providerKey: string;
    email: string | null;
    lastLoginAt: string | null;
    createdAt: string;
  }[];
}
export interface UserApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  status: string;
  allowedIps: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  permissions: string[];
}
export interface PermissionInfo {
  id: string;
  resource: string;
  action: string;
  description: string | null;
  grantedAt?: string;
}
export interface RoleDetail extends RoleSummary {
  parentRoleId: string | null;
  parentRoleName: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface RoleMember {
  userId: string;
  name: string;
  email: string;
  status: UserStatus;
  grantedAt: string;
  expiresAt: string | null;
}
export interface InvitationInfo {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
}
export interface RoleInput {
  name: string;
  description: string | null;
  parentRoleId: string | null;
  permissionIds: string[];
}
