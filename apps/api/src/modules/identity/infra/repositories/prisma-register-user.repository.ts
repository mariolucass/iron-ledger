import { Prisma } from "@prisma/client";
import type {
  RegisterUserRepository,
  RegisteredUser,
} from "../../application/use-cases/register-user.use-case";
import { prisma } from "../../../../infra/database/prisma.client";

export class PrismaRegisterUserRepository implements RegisterUserRepository {
  async create(input: { email: string; name: string; passwordHash: string }): Promise<RegisteredUser | null> {
    try {
      const user = await prisma.user.create({ data: input });
      return { id: user.id, email: user.email, name: user.name, roles: [] };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
      throw error;
    }
  }
}
