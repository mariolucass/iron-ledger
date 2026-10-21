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
