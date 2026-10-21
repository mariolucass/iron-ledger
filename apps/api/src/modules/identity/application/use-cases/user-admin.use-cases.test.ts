import { describe, expect, it } from "vitest";
import type { RoleSummary, UserAdminRepository, UserDetail, UserStatus } from "../user-admin";
import {
  CreateUserUseCase,
  SetUserRolesUseCase,
  UpdateUserUseCase,
} from "./user-admin.use-cases";

const ROLES: RoleSummary[] = ["ADMIN", "CATALOG_MANAGER"].map((name, i) => ({
  id: String(i), name, description: null, isSystem: true, userCount: 0,
}));

const user = (id: string, roles: string[], status: UserStatus = "ACTIVE"): UserDetail => ({
  id, email: `${id}@x.com`, name: id, status, mfaEnabled: false, lastLoginAt: null, createdAt: "", updatedAt: "",
  emailVerifiedAt: null, roles: roles.map((name) => ({ name, grantedAt: "", expiresAt: null })),
});

function repository(users: UserDetail[], otherActiveAdmins = 0) {
  const calls: Record<string, unknown> = {};
  const repo: UserAdminRepository = {
    list: async () => ({ items: [], page: 1, pageSize: 20, total: 0 }),
    findById: async (id) => users.find((u) => u.id === id) ?? null,
    roles: async () => ROLES,
    create: async (input) => { calls.create = input; return input.email === "dup@x.com" ? null : user("new", input.roles); },
    update: async (id, input) => { calls.update = input; return { ...users.find((u) => u.id === id)!, ...input }; },
    setRoles: async (id, roles) => { calls.setRoles = roles; return user(id, roles); },
    activeAdminCount: async () => otherActiveAdmins,
  };
  return { repo, calls };
}

describe("CreateUserUseCase", () => {
  it("cria com senha em hash e papéis válidos", async () => {
    const { repo, calls } = repository([]);
    await new CreateUserUseCase(repo).execute({ name: "Ana", email: "ana@x.com", password: "SenhaForte123", roles: ["CATALOG_MANAGER"] }, "actor");
    expect(calls.create).toMatchObject({ email: "ana@x.com", roles: ["CATALOG_MANAGER"], grantedBy: "actor" });
    expect((calls.create as { passwordHash: string }).passwordHash).not.toBe("SenhaForte123");
  });

  it("rejeita papel inexistente e e-mail repetido", async () => {
    const { repo } = repository([]);
    const useCase = new CreateUserUseCase(repo);
    await expect(useCase.execute({ name: "Ana", email: "ana@x.com", password: "SenhaForte123", roles: ["NOPE"] }, "a")).rejects.toMatchObject({ code: "ROLE_NOT_FOUND" });
    await expect(useCase.execute({ name: "Ana", email: "dup@x.com", password: "SenhaForte123", roles: [] }, "a")).rejects.toMatchObject({ statusCode: 409, code: "EMAIL_ALREADY_REGISTERED" });
  });
});

describe("UpdateUserUseCase", () => {
  it("não deixa o admin desativar a própria conta", async () => {
    const { repo } = repository([user("me", ["ADMIN"])], 3);
    await expect(new UpdateUserUseCase(repo).execute("me", { status: "INACTIVE" }, "me")).rejects.toMatchObject({ code: "SELF_LOCKOUT" });
  });

  it("não desativa o último administrador ativo", async () => {
    const { repo } = repository([user("other", ["ADMIN"])], 0);
    await expect(new UpdateUserUseCase(repo).execute("other", { status: "SUSPENDED" }, "actor")).rejects.toMatchObject({ code: "LAST_ADMIN" });
  });

  it("desativa usuário comum e renomeia sem restrições", async () => {
    const { repo, calls } = repository([user("u1", [])], 0);
    await new UpdateUserUseCase(repo).execute("u1", { status: "INACTIVE", name: "Novo" }, "actor");
    expect(calls.update).toEqual({ status: "INACTIVE", name: "Novo" });
  });

  it("responde 404 para usuário inexistente", async () => {
    const { repo } = repository([]);
    await expect(new UpdateUserUseCase(repo).execute("x", { name: "N" }, "a")).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("SetUserRolesUseCase", () => {
  it("impede remover o próprio papel ADMIN", async () => {
    const { repo } = repository([user("me", ["ADMIN"])], 2);
    await expect(new SetUserRolesUseCase(repo).execute("me", [], "me")).rejects.toMatchObject({ code: "SELF_LOCKOUT" });
  });

  it("impede remover ADMIN do último administrador", async () => {
    const { repo } = repository([user("last", ["ADMIN"])], 0);
    await expect(new SetUserRolesUseCase(repo).execute("last", ["CATALOG_MANAGER"], "actor")).rejects.toMatchObject({ code: "LAST_ADMIN" });
  });

  it("permite remover ADMIN quando existe outro administrador ativo", async () => {
    const { repo, calls } = repository([user("a2", ["ADMIN"])], 1);
    await new SetUserRolesUseCase(repo).execute("a2", ["CATALOG_MANAGER"], "actor");
    expect(calls.setRoles).toEqual(["CATALOG_MANAGER"]);
  });

  it("não restringe quem não é administrador", async () => {
    const { repo } = repository([user("u", ["CATALOG_MANAGER"])], 0);
    await expect(new SetUserRolesUseCase(repo).execute("u", [], "actor")).resolves.toBeDefined();
  });
});
