import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { RegisterUserUseCase, type RegisterUserRepository } from "./register-user.use-case";

const secret = "test-secret-with-at-least-thirty-two-characters";

function repository(taken = false) {
  const created: { email: string; name: string; passwordHash: string }[] = [];
  const repo: RegisterUserRepository = {
    create: async (input) => {
      if (taken) return null;
      created.push(input);
      return { id: "8cf0bdf3-8d63-4d29-a820-7346144d75e8", email: input.email, name: input.name, roles: [] };
    },
  };
  return { repo, created };
}

describe("RegisterUserUseCase", () => {
  it("cria o usuário sem papéis, normaliza o e-mail e emite um JWT", async () => {
    const { repo, created } = repository();
    const result = await new RegisterUserUseCase(repo, secret, "1h").execute({
      name: "  Maria Silva ",
      email: " MARIA@Example.com ",
      password: "CorrectPassword123!",
    });

    expect(result.accessToken.split(".")).toHaveLength(3);
    expect(result.user).toMatchObject({ email: "maria@example.com", name: "Maria Silva", roles: [] });
    expect(created[0]?.passwordHash).not.toBe("CorrectPassword123!");
    expect(await bcrypt.compare("CorrectPassword123!", created[0]!.passwordHash)).toBe(true);
  });

  it("rejeita e-mail já cadastrado com 409", async () => {
    const { repo } = repository(true);
    await expect(
      new RegisterUserUseCase(repo, secret).execute({ name: "Maria", email: "maria@example.com", password: "CorrectPassword123!" }),
    ).rejects.toMatchObject({ statusCode: 409, code: "EMAIL_ALREADY_REGISTERED" });
  });
});
