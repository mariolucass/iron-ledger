import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { AppError } from "../../../../shared/errors/domain.error";

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

    const accessToken = jwt.sign(
      { email: user.email, name: user.name, roles: user.roles },
      this.jwtSecret,
      { subject: user.id, expiresIn: this.jwtExpiresIn, issuer: "iron-ledger-api" },
    );

    return {
      accessToken,
      tokenType: "Bearer" as const,
      expiresIn: this.jwtExpiresIn,
      user: { id: user.id, email: user.email, name: user.name, roles: user.roles },
    };
  }
}
