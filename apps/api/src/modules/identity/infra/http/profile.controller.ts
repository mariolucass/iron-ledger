import { z } from "zod";
import { handle } from "../../../../infra/http/handle";
import { preferencesSchema } from "../../application/profile";
import type { ChangePasswordUseCase } from "../../application/use-cases/change-password.use-case";
import type { GetProfileUseCase } from "../../application/use-cases/get-profile.use-case";
import type { UpdatePreferencesUseCase } from "../../application/use-cases/update-preferences.use-case";
import type { UpdateProfileUseCase } from "../../application/use-cases/update-profile.use-case";

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

export class ProfileController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly updatePreferences: UpdatePreferencesUseCase,
    private readonly changePassword: ChangePasswordUseCase,
  ) {}

  me = handle(200, (request) => this.getProfile.execute(request.auth!.userId));
  patchMe = handle(200, (request) =>
    this.updateProfile.execute(request.auth!.userId, updateProfileSchema.parse(request.body)),
  );
  patchPreferences = handle(200, (request) =>
    this.updatePreferences.execute(request.auth!.userId, preferencesSchema.parse(request.body)),
  );
  postPassword = handle(200, (request) =>
    this.changePassword.execute(request.auth!.userId, changePasswordSchema.parse(request.body)),
  );
}
