import bcrypt from "bcryptjs";
import type { SignOptions } from "jsonwebtoken";
import { AppError } from "../../../../shared/errors/domain.error";
import { issueAccessToken } from "../issue-access-token";

export type LoginUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  deletedAt: Date | null;
  roles: string[];
};

export interface LoginUserRepository {
  findByEmail(email: string): Promise<LoginUser | null>;
  /** Registra o horário do último acesso bem-sucedido. */
  recordLogin?(userId: string): Promise<void>;
}

export type LoginInput = { email: string; password: string };

export class LoginUseCase {
  constructor(
    private readonly users: LoginUserRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: SignOptions["expiresIn"] = "1h",
  ) {}

  async execute(input: LoginInput) {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError("E-mail ou senha inválidos", 401, "INVALID_CREDENTIALS");
    }

    if (user.status !== "ACTIVE" || user.deletedAt) {
      throw new AppError("Usuário não está ativo", 403, "USER_INACTIVE");
    }

    // O horário do último acesso é informativo: uma falha aqui não pode barrar o login.
    await this.users.recordLogin?.(user.id).catch(() => undefined);

    return issueAccessToken(user, this.jwtSecret, this.jwtExpiresIn);
  }
}
