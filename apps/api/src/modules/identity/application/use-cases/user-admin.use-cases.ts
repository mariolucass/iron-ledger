import bcrypt from "bcryptjs";
import { AppError } from "../../../../shared/errors/domain.error";
import { NotFoundError } from "../../../../shared/errors/not-found.error";
import { ValidationError } from "../../../../shared/errors/validation.error";
import {
  ADMIN_ROLE,
  type CreateUserInput,
  type ListUsersQuery,
  type UpdateUserInput,
  type UserAdminRepository,
  type UserDetail,
} from "../user-admin";

const BCRYPT_ROUNDS = 12;

async function load(users: UserAdminRepository, id: string): Promise<UserDetail> {
  const user = await users.findById(id);
  if (!user) throw new NotFoundError("Usuário não encontrado");
  return user;
}

const isActiveAdmin = (user: UserDetail) => user.status === "ACTIVE" && user.roles.some((role) => role.name === ADMIN_ROLE);

/** Impede que o sistema fique sem nenhum administrador ativo. */
async function assertAdminRemains(users: UserAdminRepository, target: UserDetail) {
  if (isActiveAdmin(target) && (await users.activeAdminCount(target.id)) === 0) {
    throw new AppError("Esta é a última conta de administrador ativa", 409, "LAST_ADMIN");
  }
}

async function assertRolesExist(users: UserAdminRepository, names: string[]) {
  const known = new Set((await users.roles()).map((role) => role.name));
  const missing = names.filter((name) => !known.has(name));
  if (missing.length) throw new ValidationError(`Papel não encontrado: ${missing.join(", ")}`, "ROLE_NOT_FOUND");
}

export class ListUsersUseCase {
  constructor(private readonly users: UserAdminRepository) {}
  execute(query: ListUsersQuery) {
    return this.users.list(query);
  }
}

export class GetUserUseCase {
  constructor(private readonly users: UserAdminRepository) {}
  execute(id: string) {
    return load(this.users, id);
  }
}

export class ListRolesUseCase {
  constructor(private readonly users: UserAdminRepository) {}
  async execute() {
    return { items: await this.users.roles() };
  }
}

export class CreateUserUseCase {
  constructor(private readonly users: UserAdminRepository) {}

  async execute(input: CreateUserInput, actorId: string) {
    await assertRolesExist(this.users, input.roles);
    const created = await this.users.create({
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      roles: input.roles,
      grantedBy: actorId,
    });
    if (!created) throw new AppError("Este e-mail já está cadastrado", 409, "EMAIL_ALREADY_REGISTERED");
    return created;
  }
}

export class UpdateUserUseCase {
  constructor(private readonly users: UserAdminRepository) {}

  async execute(id: string, input: UpdateUserInput, actorId: string) {
    const target = await load(this.users, id);

    if (input.status && input.status !== "ACTIVE" && target.status === "ACTIVE") {
      if (id === actorId) {
        throw new AppError("Você não pode desativar a própria conta", 409, "SELF_LOCKOUT");
      }
      await assertAdminRemains(this.users, target);
    }
    return this.users.update(id, input);
  }
}

export class SetUserRolesUseCase {
  constructor(private readonly users: UserAdminRepository) {}

  async execute(id: string, roles: string[], actorId: string) {
    const target = await load(this.users, id);
    await assertRolesExist(this.users, roles);

    const losesAdmin = target.roles.some((role) => role.name === ADMIN_ROLE) && !roles.includes(ADMIN_ROLE);
    if (losesAdmin) {
      if (id === actorId) {
        throw new AppError("Você não pode remover o próprio papel de administrador", 409, "SELF_LOCKOUT");
      }
      await assertAdminRemains(this.users, target);
    }
    return this.users.setRoles(id, roles, actorId);
  }
}
