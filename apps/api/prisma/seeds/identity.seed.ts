import bcrypt from "bcryptjs";
import { roles, usersFromEnv } from "./data/identity.data";
import type { Seed } from "./types";

export const identitySeed: Seed = {
  name: "identity",
  async run({ prisma, log }) {
    const roleIds = new Map<string, string>();
    for (const role of roles) {
      const saved = await prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description, isSystem: role.isSystem, deletedAt: null },
        create: role,
      });
      roleIds.set(role.name, saved.id);
    }

    for (const seedUser of usersFromEnv(process.env)) {
      const passwordHash = await bcrypt.hash(seedUser.password, 12);
      const user = await prisma.user.upsert({
        where: { email: seedUser.email },
        update: { name: seedUser.name, passwordHash, status: "ACTIVE", deletedAt: null },
        create: { email: seedUser.email, name: seedUser.name, passwordHash },
      });

      for (const roleName of seedUser.roles) {
        const roleId = roleIds.get(roleName);
        if (!roleId) throw new Error(`Papel ${roleName} não encontrado.`);
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId } },
          update: {},
          create: { userId: user.id, roleId },
        });
      }
      log(`usuário ${seedUser.email} (${seedUser.roles.join(", ")})`);
    }
  },
};
