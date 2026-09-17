import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { LoginUseCase } from "../../application/use-cases/login.use-case";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export class AuthController {
  constructor(private readonly login: LoginUseCase) {}

  handleLogin = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const input = loginSchema.parse(request.body);
      response.json(await this.login.execute(input));
    } catch (error) {
      next(error);
    }
  };
}
