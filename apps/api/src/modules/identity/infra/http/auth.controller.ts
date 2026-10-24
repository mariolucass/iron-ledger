import { z } from "zod";
import { handle } from "../../../../infra/http/handle";
import type { LoginUseCase } from "../../application/use-cases/login.use-case";
import type { RegisterUserUseCase } from "../../application/use-cases/register-user.use-case";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  // bcrypt só considera os primeiros 72 bytes.
  password: z.string().min(8).max(72),
});

export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly registerUser: RegisterUserUseCase,
  ) {}

  handleLogin = handle(200, (request) => this.login.execute(loginSchema.parse(request.body)));
  handleRegister = handle(201, (request) =>
    this.registerUser.execute(registerSchema.parse(request.body)),
  );
}
