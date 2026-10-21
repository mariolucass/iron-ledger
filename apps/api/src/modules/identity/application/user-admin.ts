import { z } from "zod";

export const USER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Papel com acesso irrestrito (espelha `SUPER_ROLES` do rbac.guard). */
export const ADMIN_ROLE = "ADMIN";

const roleNames = z
  .array(z.string().trim().min(1).max(64))
  .max(20)
  .transform((names) => [...new Set(names)]);

export const listUsersSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  status: z.enum(USER_STATUSES).optional(),
  role: z.string().trim().min(1).max(64).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
  roles: roleNames.default([]),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  status: z.enum(USER_STATUSES).optional(),
});

export const setRolesSchema = z.object({ roles: roleNames });

export type ListUsersQuery = z.infer<typeof listUsersSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export type UserListItem = {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  roles: string[];
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type UserDetail = Omit<UserListItem, "roles"> & {
  roles: { name: string; grantedAt: string; expiresAt: string | null }[];
  emailVerifiedAt: string | null;
  updatedAt: string;
};

export type RoleSummary = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
};

export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };

export interface UserAdminRepository {
  list(query: ListUsersQuery): Promise<Page<UserListItem>>;
  findById(id: string): Promise<UserDetail | null>;
  roles(): Promise<RoleSummary[]>;
  /** Retorna `null` quando o e-mail já está em uso. */
  create(input: { name: string; email: string; passwordHash: string; roles: string[]; grantedBy: string }): Promise<UserDetail | null>;
  update(id: string, input: UpdateUserInput): Promise<UserDetail>;
  /** Substitui os papéis aplicando só a diferença; concessões mantidas preservam a data original. */
  setRoles(id: string, roles: string[], grantedBy: string): Promise<UserDetail>;
  /** Usuários ativos com o papel ADMIN, ignorando `excludingUserId`. */
  activeAdminCount(excludingUserId: string): Promise<number>;
}
