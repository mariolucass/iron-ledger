import type { Prisma } from "@prisma/client";
import type { Preferences, ProfileRecord, ProfileRepository } from "../../application/profile";
import { prisma } from "../../../../infra/database/prisma.client";

const include = { userRoles: { include: { role: true } } } satisfies Prisma.UserInclude;

type UserWithRoles = Prisma.UserGetPayload<{ include: typeof include }>;

function toRecord(user: UserWithRoles): ProfileRecord {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    locale: user.locale,
    timezone: user.timezone,
    preferences: user.preferences,
    roles: user.userRoles.map(({ role }) => role.name),
  };
}

export class PrismaProfileRepository implements ProfileRepository {
  async findById(id: string): Promise<ProfileRecord | null> {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, include });
    return user ? toRecord(user) : null;
  }

  async update(
    id: string,
    data: Partial<Pick<ProfileRecord, "name" | "avatarUrl" | "locale" | "timezone">>,
  ): Promise<ProfileRecord> {
    return toRecord(await prisma.user.update({ where: { id }, data, include }));
  }

  async savePreferences(id: string, preferences: Preferences): Promise<void> {
    await prisma.user.update({ where: { id }, data: { preferences } });
  }

  async findPasswordHash(id: string): Promise<string | null> {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { passwordHash: true } });
    return user?.passwordHash ?? null;
  }

  async savePasswordHash(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { passwordHash, passwordChangedAt: new Date() } });
  }
}
