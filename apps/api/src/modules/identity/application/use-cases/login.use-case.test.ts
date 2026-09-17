import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { LoginUseCase, type LoginUserRepository } from "./login.use-case";

const secret = "test-secret-with-at-least-thirty-two-characters";

async function repository(password = "CorrectPassword123!"): Promise<LoginUserRepository> {
  const passwordHash = await bcrypt.hash(password, 4);
  return {
    findByEmail: async (email) => ({
      id: "8cf0bdf3-8d63-4d29-a820-7346144d75e8",
      email,
      name: "Test User",
      passwordHash,
      status: "ACTIVE",
      deletedAt: null,
      roles: ["ADMIN"],
    }),
  };
}

describe("LoginUseCase", () => {
  it("emite um JWT para credenciais válidas", async () => {
    const useCase = new LoginUseCase(await repository(), secret, "1h");
    const result = await useCase.execute({ email: "USER@example.com", password: "CorrectPassword123!" });
    expect(result.accessToken.split(".")).toHaveLength(3);
    expect(result.user.email).toBe("user@example.com");
    expect(result.user.roles).toEqual(["ADMIN"]);
  });

  it("rejeita senha inválida sem revelar qual credencial falhou", async () => {
    const useCase = new LoginUseCase(await repository(), secret, "1h");
    await expect(
      useCase.execute({ email: "user@example.com", password: "WrongPassword123!" }),
    ).rejects.toMatchObject({ statusCode: 401, code: "INVALID_CREDENTIALS" });
  });
});
