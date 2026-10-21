import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
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

  handleLogin = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const input = loginSchema.parse(request.body);
      response.json(await this.login.execute(input));
    } catch (error) {
      next(error);
    }
  };

  handleRegister = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const input = registerSchema.parse(request.body);
      response.status(201).json(await this.registerUser.execute(input));
    } catch (error) {
      next(error);
    }
  };
}
