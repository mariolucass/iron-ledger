import { z } from "zod";
import { handle } from "../../../../infra/http/handle";
import {
  createUserSchema,
  listUsersSchema,
  setRolesSchema,
  updateUserSchema,
} from "../../application/user-admin";
import type {
  CreateUserUseCase,
  GetUserUseCase,
  ListRolesUseCase,
  ListUsersUseCase,
  SetUserRolesUseCase,
  UpdateUserUseCase,
} from "../../application/use-cases/user-admin.use-cases";
import type { IdentityDirectoryUseCase } from "../../application/identity-directory";

const idSchema = z.object({ id: z.string().uuid() });

export class UserAdminController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly listRoles: ListRolesUseCase,
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly setUserRoles: SetUserRolesUseCase,
    private readonly directory: IdentityDirectoryUseCase,
  ) {}

  list = handle(200, (request) => this.listUsers.execute(listUsersSchema.parse(request.query)));
  get = handle(200, (request) => this.getUser.execute(idSchema.parse(request.params).id));
  roles = handle(200, () => this.listRoles.execute());
  userSection = handle(200, (request) => {
    const { id, section } = z
      .object({
        id: z.string().uuid(),
        section: z.enum(["warehouses", "sessions", "security", "api-keys"]),
      })
      .parse(request.params);
    return this.directory.userSection(id, section);
  });
  role = handle(200, (request) => this.directory.role(idSchema.parse(request.params).id));
  roleSection = handle(200, (request) => {
    const { id, section } = z
      .object({ id: z.string().uuid(), section: z.enum(["permissions", "members"]) })
      .parse(request.params);
    return this.directory.roleSection(id, section);
  });
  permissions = handle(200, () => this.directory.permissions());
  invitations = handle(200, () => this.directory.invitations());
  createRole = handle(201, (request) =>
    this.directory.createRole(
      z
        .object({
          name: z.string().trim().min(2).max(64),
          description: z.string().trim().max(500).nullable().default(null),
          parentRoleId: z.string().uuid().nullable().default(null),
          permissionIds: z.array(z.string().uuid()).default([]),
        })
        .parse(request.body),
    ),
  );
  updateRole = handle(200, (request) =>
    this.directory.updateRole(
      idSchema.parse(request.params).id,
      z
        .object({
          name: z.string().trim().min(2).max(64).optional(),
          description: z.string().trim().max(500).nullable().optional(),
          parentRoleId: z.string().uuid().nullable().optional(),
          permissionIds: z.array(z.string().uuid()).optional(),
        })
        .parse(request.body),
    ),
  );
  create = handle(201, (request) =>
    this.createUser.execute(createUserSchema.parse(request.body), request.auth!.userId),
  );
  update = handle(200, (request) =>
    this.updateUser.execute(
      idSchema.parse(request.params).id,
      updateUserSchema.parse(request.body),
      request.auth!.userId,
    ),
  );
  setRoles = handle(200, (request) =>
    this.setUserRoles.execute(
      idSchema.parse(request.params).id,
      setRolesSchema.parse(request.body).roles,
      request.auth!.userId,
    ),
  );
}
