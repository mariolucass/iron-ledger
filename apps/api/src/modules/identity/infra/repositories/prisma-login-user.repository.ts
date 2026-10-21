import type { LoginUser, LoginUserRepository } from "../../application/use-cases/login.use-case";
import { prisma } from "../../../../infra/database/prisma.client";

export class PrismaLoginUserRepository implements LoginUserRepository {
  async findByEmail(email: string): Promise<LoginUser | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      status: user.status,
      deletedAt: user.deletedAt,
      roles: user.userRoles.map(({ role }) => role.name),
    };
  }

  async recordLogin(userId: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }
}
