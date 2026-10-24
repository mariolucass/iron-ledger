import { prisma } from "../../../../infra/database/prisma.client";
import { Prisma } from "@prisma/client";
import { AppError } from "../../../../shared/errors/domain.error";
import { ValidationError } from "../../../../shared/errors/validation.error";
import type {
  IdentityDirectoryRepository,
  RoleSection,
  UserSection,
} from "../../application/identity-directory";

const iso = (date: Date | null) => date?.toISOString() ?? null;

export class PrismaIdentityDirectoryRepository implements IdentityDirectoryRepository {
  async userSection(id: string, section: UserSection) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        mfaEnabled: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        passwordChangedAt: true,
        externalId: true,
      },
    });
    if (!user) return null;
    switch (section) {
      case "warehouses": {
        const rows = await prisma.userWarehouseAccess.findMany({
          where: { userId: id },
          include: { warehouse: { select: { id: true, code: true, name: true, isActive: true } } },
          orderBy: { grantedAt: "desc" },
        });
        return rows.map((row) => ({
          warehouseId: row.warehouseId,
          code: row.warehouse.code,
          name: row.warehouse.name,
          isActive: row.warehouse.isActive,
          accessLevel: row.accessLevel,
          grantedAt: row.grantedAt.toISOString(),
          expiresAt: iso(row.expiresAt),
        }));
      }
      case "sessions": {
        const rows = await prisma.userSession.findMany({
          where: { userId: id },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            status: true,
            userAgent: true,
            ipAddress: true,
            expiresAt: true,
            lastUsedAt: true,
            revokedAt: true,
            createdAt: true,
          },
        });
        return rows.map((row) => ({
          ...row,
          ipAddress: row.ipAddress ? String(row.ipAddress) : null,
          expiresAt: row.expiresAt.toISOString(),
          lastUsedAt: iso(row.lastUsedAt),
          revokedAt: iso(row.revokedAt),
          createdAt: row.createdAt.toISOString(),
        }));
      }
      case "security": {
        const [factors, identities] = await Promise.all([
          prisma.mfaFactor.findMany({
            where: { userId: id, deletedAt: null },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              method: true,
              label: true,
              verifiedAt: true,
              lastUsedAt: true,
              createdAt: true,
            },
          }),
          prisma.federatedIdentity.findMany({
            where: { userId: id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              provider: true,
              providerKey: true,
              email: true,
              lastLoginAt: true,
              createdAt: true,
            },
          }),
        ]);
        return {
          mfaEnabled: user.mfaEnabled,
          failedLoginAttempts: user.failedLoginAttempts,
          lockedUntil: iso(user.lockedUntil),
          passwordChangedAt: iso(user.passwordChangedAt),
          externalId: user.externalId,
          factors: factors.map((row) => ({
            ...row,
            verifiedAt: iso(row.verifiedAt),
            lastUsedAt: iso(row.lastUsedAt),
            createdAt: row.createdAt.toISOString(),
          })),
          identities: identities.map((row) => ({
            ...row,
            lastLoginAt: iso(row.lastLoginAt),
            createdAt: row.createdAt.toISOString(),
          })),
        };
      }
      case "api-keys": {
        const rows = await prisma.apiKey.findMany({
          where: { ownerId: id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            prefix: true,
            status: true,
            allowedIps: true,
            expiresAt: true,
            lastUsedAt: true,
            createdAt: true,
            permissions: { select: { permission: { select: { resource: true, action: true } } } },
          },
        });
        return rows.map((row) => ({
          id: row.id,
          name: row.name,
          prefix: row.prefix,
          status: row.status,
          allowedIps: row.allowedIps,
          expiresAt: iso(row.expiresAt),
          lastUsedAt: iso(row.lastUsedAt),
          createdAt: row.createdAt.toISOString(),
          permissions: row.permissions.map(
            ({ permission }) => `${permission.resource}:${permission.action}`,
          ),
        }));
      }
    }
  }

  async role(id: string) {
    const row = await prisma.role.findFirst({
      where: { id, deletedAt: null },
      include: {
        parentRole: { select: { id: true, name: true } },
        _count: { select: { userRoles: true } },
      },
    });
    return (
      row && {
        id: row.id,
        name: row.name,
        description: row.description,
        isSystem: row.isSystem,
        parentRoleId: row.parentRoleId,
        parentRoleName: row.parentRole?.name ?? null,
        userCount: row._count.userRoles,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    );
  }
  async roleSection(id: string, section: RoleSection) {
    const role = await prisma.role.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!role) return null;
    if (section === "permissions") {
      const rows = await prisma.rolePermission.findMany({
        where: { roleId: id },
        include: { permission: true },
        orderBy: { permission: { resource: "asc" } },
      });
      return rows.map((row) => ({
        id: row.permissionId,
        resource: row.permission.resource,
        action: row.permission.action,
        description: row.permission.description,
        grantedAt: row.grantedAt.toISOString(),
      }));
    }
    const rows = await prisma.userRole.findMany({
      where: { roleId: id, user: { deletedAt: null } },
      include: { user: { select: { id: true, name: true, email: true, status: true } } },
      orderBy: { grantedAt: "desc" },
    });
    return rows.map((row) => ({
      userId: row.userId,
      name: row.user.name,
      email: row.user.email,
      status: row.user.status,
      grantedAt: row.grantedAt.toISOString(),
      expiresAt: iso(row.expiresAt),
    }));
  }
  async permissions() {
    return prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
      select: { id: true, resource: true, action: true, description: true },
    });
  }
  async invitations() {
    const rows = await prisma.verificationToken.findMany({
      where: { purpose: "INVITATION" },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      name: row.user.name,
      email: row.user.email,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      consumedAt: iso(row.consumedAt),
    }));
  }
  async createRole(input: {
    name: string;
    description: string | null;
    parentRoleId: string | null;
    permissionIds: string[];
  }) {
    await this.validateReferences(input.parentRoleId, input.permissionIds);
    try {
      const row = await prisma.$transaction(async (tx) => {
        const created = await tx.role.create({
          data: {
            name: input.name,
            description: input.description,
            parentRoleId: input.parentRoleId,
          },
          select: { id: true },
        });
        if (input.permissionIds.length) {
          await tx.rolePermission.createMany({
            data: [...new Set(input.permissionIds)].map((permissionId) => ({
              roleId: created.id,
              permissionId,
            })),
          });
        }
        return created;
      });
      return this.role(row.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
        throw new AppError("Já existe um papel com este nome.", 409, "ROLE_EXISTS");
      throw error;
    }
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
    const current = await prisma.role.findFirst({
      where: { id, deletedAt: null },
      select: { isSystem: true, parentRoleId: true },
    });
    if (!current) return null;
    if (current.isSystem) throw new ValidationError("Papéis de sistema não podem ser alterados.");
    if (input.parentRoleId === id)
      throw new ValidationError("Um papel não pode herdar de si mesmo.");
    if (input.parentRoleId) {
      const visited = new Set([id]);
      let parent: string | null = input.parentRoleId;
      while (parent) {
        if (visited.has(parent)) throw new ValidationError("Herança circular entre papéis.");
        visited.add(parent);
        const candidate: { parentRoleId: string | null } | null = await prisma.role.findFirst({
          where: { id: parent, deletedAt: null },
          select: { parentRoleId: true },
        });
        if (!candidate) throw new ValidationError("Papel pai não encontrado.");
        parent = candidate.parentRoleId;
      }
    }
    await this.validateReferences(input.parentRoleId, input.permissionIds);
    try {
      await prisma.$transaction(async (tx) => {
        await tx.role.update({
          where: { id },
          data: {
            name: input.name,
            description: input.description,
            parentRoleId: input.parentRoleId,
            version: { increment: 1 },
          },
        });
        if (input.permissionIds) {
          await tx.rolePermission.deleteMany({ where: { roleId: id } });
          await tx.rolePermission.createMany({
            data: [...new Set(input.permissionIds)].map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          });
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
        throw new AppError("Já existe um papel com este nome.", 409, "ROLE_EXISTS");
      throw error;
    }
    return this.role(id);
  }
  private async validateReferences(parentRoleId?: string | null, permissionIds?: string[]) {
    if (
      parentRoleId &&
      !(await prisma.role.findFirst({
        where: { id: parentRoleId, deletedAt: null },
        select: { id: true },
      }))
    )
      throw new ValidationError("Papel pai não encontrado.");
    if (permissionIds?.length) {
      const found = await prisma.permission.count({ where: { id: { in: permissionIds } } });
      if (found !== new Set(permissionIds).size)
        throw new ValidationError("Uma ou mais permissões não foram encontradas.");
    }
  }
}
