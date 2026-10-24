import { NotFoundError } from "../../../shared/errors/not-found.error";

export type UserSection = "warehouses" | "sessions" | "security" | "api-keys";
export type RoleSection = "permissions" | "members";

export interface IdentityDirectoryRepository {
  userSection(id: string, section: UserSection): Promise<unknown | null>;
  role(id: string): Promise<unknown | null>;
  roleSection(id: string, section: RoleSection): Promise<unknown | null>;
  permissions(): Promise<unknown>;
  invitations(): Promise<unknown>;
  createRole(input: {
    name: string;
    description: string | null;
    parentRoleId: string | null;
    permissionIds: string[];
  }): Promise<unknown>;
  updateRole(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      parentRoleId?: string | null;
      permissionIds?: string[];
    },
  ): Promise<unknown | null>;
}

export class IdentityDirectoryUseCase {
  constructor(private readonly repository: IdentityDirectoryRepository) {}
  async userSection(id: string, section: UserSection) {
    const result = await this.repository.userSection(id, section);
    if (result === null) throw new NotFoundError("Usuário não encontrado.");
    return result;
  }
  async role(id: string) {
    const result = await this.repository.role(id);
    if (result === null) throw new NotFoundError("Papel não encontrado.");
    return result;
  }
  async roleSection(id: string, section: RoleSection) {
    const result = await this.repository.roleSection(id, section);
    if (result === null) throw new NotFoundError("Papel não encontrado.");
    return result;
  }
  permissions() {
    return this.repository.permissions();
  }
  invitations() {
    return this.repository.invitations();
  }
  createRole(input: {
    name: string;
    description: string | null;
    parentRoleId: string | null;
    permissionIds: string[];
  }) {
    return this.repository.createRole(input);
  }
  async updateRole(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      parentRoleId?: string | null;
      permissionIds?: string[];
    },
  ) {
    const result = await this.repository.updateRole(id, input);
    if (result === null) throw new NotFoundError("Papel não encontrado.");
    return result;
  }
}
