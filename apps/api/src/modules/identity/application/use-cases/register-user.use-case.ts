import bcrypt from "bcryptjs";
import type { SignOptions } from "jsonwebtoken";
import { AppError } from "../../../../shared/errors/domain.error";
import { issueAccessToken } from "../issue-access-token";

export type RegisteredUser = { id: string; email: string; name: string; roles: string[] };

export interface RegisterUserRepository {
  /** Retorna `null` quando o e-mail já está em uso (inclusive por corrida entre requisições). */
  create(input: { email: string; name: string; passwordHash: string }): Promise<RegisteredUser | null>;
}

export type RegisterUserInput = { name: string; email: string; password: string };

const BCRYPT_ROUNDS = 12;

export class RegisterUserUseCase {
  constructor(
    private readonly users: RegisterUserRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: SignOptions["expiresIn"] = "1h",
  ) {}

  async execute(input: RegisterUserInput) {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    // Autoatendimento nunca concede papéis: o usuário nasce sem privilégios.
    const user = await this.users.create({
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      passwordHash,
    });

    if (!user) throw new AppError("Este e-mail já está cadastrado", 409, "EMAIL_ALREADY_REGISTERED");

    return issueAccessToken(user, this.jwtSecret, this.jwtExpiresIn);
  }
}
