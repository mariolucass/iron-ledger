import { Prisma } from "@prisma/client";
import { prisma } from "../../../../infra/database/prisma.client";
import { pagination } from "../../../../shared/utils/pagination";
import {
  ADMIN_ROLE,
  type ListUsersQuery,
  type Page,
  type RoleSummary,
  type UpdateUserInput,
  type UserAdminRepository,
  type UserDetail,
  type UserListItem,
} from "../../application/user-admin";

const include = { userRoles: { include: { role: true }, orderBy: { grantedAt: "asc" } } } satisfies Prisma.UserInclude;
type UserWithRoles = Prisma.UserGetPayload<{ include: typeof include }>;

const iso = (date: Date | null) => (date ? date.toISOString() : null);

function toListItem(user: UserWithRoles): UserListItem {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    roles: user.userRoles.map(({ role }) => role.name),
    mfaEnabled: user.mfaEnabled,
    lastLoginAt: iso(user.lastLoginAt),
    createdAt: user.createdAt.toISOString(),
  };
}

function toDetail(user: UserWithRoles): UserDetail {
  return {
    ...toListItem(user),
    roles: user.userRoles.map(({ role, grantedAt, expiresAt }) => ({
      name: role.name,
      grantedAt: grantedAt.toISOString(),
      expiresAt: iso(expiresAt),
    })),
    emailVerifiedAt: iso(user.emailVerifiedAt),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export class PrismaUserAdminRepository implements UserAdminRepository {
  async list(query: ListUsersQuery): Promise<Page<UserListItem>> {
    const { page, pageSize, skip, take } = pagination(query.page, query.pageSize);
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.role ? { userRoles: { some: { role: { name: query.role } } } } : {}),
      ...(query.q
        ? { OR: [{ name: { contains: query.q, mode: "insensitive" } }, { email: { contains: query.q, mode: "insensitive" } }] }
        : {}),
    };
    const [total, rows] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, include, orderBy: [{ name: "asc" }, { id: "asc" }], skip, take }),
    ]);
    return { page, pageSize, total, items: rows.map(toListItem) };
  }

  async findById(id: string): Promise<UserDetail | null> {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, include });
    return user ? toDetail(user) : null;
  }

  async roles(): Promise<RoleSummary[]> {
    const rows = await prisma.role.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: { _count: { select: { userRoles: true } } },
    });
    return rows.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.userRoles,
    }));
  }

  async create(input: { name: string; email: string; passwordHash: string; roles: string[]; grantedBy: string }) {
    try {
      const roles = await prisma.role.findMany({ where: { name: { in: input.roles }, deletedAt: null }, select: { id: true } });
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: input.passwordHash,
          userRoles: { create: roles.map(({ id }) => ({ roleId: id, grantedBy: input.grantedBy })) },
        },
        include,
      });
      return toDetail(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
      throw error;
    }
  }

  async update(id: string, input: UpdateUserInput): Promise<UserDetail> {
    return toDetail(await prisma.user.update({ where: { id }, data: { ...input, version: { increment: 1 } }, include }));
  }

  async setRoles(id: string, names: string[], grantedBy: string): Promise<UserDetail> {
    return prisma.$transaction(async (tx) => {
      const wanted = await tx.role.findMany({ where: { name: { in: names }, deletedAt: null }, select: { id: true } });
      const wantedIds = new Set(wanted.map((role) => role.id));
      const current = await tx.userRole.findMany({ where: { userId: id }, select: { roleId: true } });
      const currentIds = new Set(current.map((row) => row.roleId));

      const toRemove = [...currentIds].filter((roleId) => !wantedIds.has(roleId));
      const toAdd = [...wantedIds].filter((roleId) => !currentIds.has(roleId));
      if (toRemove.length) await tx.userRole.deleteMany({ where: { userId: id, roleId: { in: toRemove } } });
      if (toAdd.length) await tx.userRole.createMany({ data: toAdd.map((roleId) => ({ userId: id, roleId, grantedBy })) });

      return toDetail(await tx.user.findUniqueOrThrow({ where: { id }, include }));
    });
  }

  activeAdminCount(excludingUserId: string): Promise<number> {
    return prisma.user.count({
      where: {
        id: { not: excludingUserId },
        status: "ACTIVE",
        deletedAt: null,
        userRoles: { some: { role: { name: ADMIN_ROLE } } },
      },
    });
  }
}
