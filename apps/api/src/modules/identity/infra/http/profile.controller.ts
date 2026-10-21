import type { NextFunction, Response } from "express";
import { z } from "zod";
import { preferencesSchema } from "../../application/profile";
import type { ChangePasswordUseCase } from "../../application/use-cases/change-password.use-case";
import type { GetProfileUseCase } from "../../application/use-cases/get-profile.use-case";
import type { UpdatePreferencesUseCase } from "../../application/use-cases/update-preferences.use-case";
import type { UpdateProfileUseCase } from "../../application/use-cases/update-profile.use-case";
import type { AuthenticatedRequest } from "../guards/jwt.guard";

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    avatarUrl: z
      .string()
      .trim()
      .url()
      .max(2048)
      .refine((url) => /^https?:\/\//i.test(url), "A URL deve usar http ou https")
      .nullable(),
    locale: z.string().trim().min(2).max(20),
    timezone: z
      .string()
      .trim()
      .refine((tz) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      }, "Fuso horário inválido"),
  })
  .partial();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

type Handler = (request: AuthenticatedRequest, response: Response, next: NextFunction) => Promise<void>;

export class ProfileController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly updatePreferences: UpdatePreferencesUseCase,
    private readonly changePassword: ChangePasswordUseCase,
  ) {}

  private handle(run: (userId: string, request: AuthenticatedRequest) => Promise<unknown>): Handler {
    return async (request, response, next) => {
      try {
        response.json(await run(request.auth!.userId, request));
      } catch (error) {
        next(error);
      }
    };
  }

  me = this.handle((userId) => this.getProfile.execute(userId));
  patchMe = this.handle((userId, request) =>
    this.updateProfile.execute(userId, updateProfileSchema.parse(request.body)),
  );
  patchPreferences = this.handle((userId, request) =>
    this.updatePreferences.execute(userId, preferencesSchema.parse(request.body)),
  );
  postPassword = this.handle((userId, request) =>
    this.changePassword.execute(userId, changePasswordSchema.parse(request.body)),
  );
}
