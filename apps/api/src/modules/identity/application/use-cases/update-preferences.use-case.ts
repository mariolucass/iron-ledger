import { NotFoundError } from "../../../../shared/errors/not-found.error";
import { resolvePreferences, type PreferencesPatch, type ProfileRepository } from "../profile";

export class UpdatePreferencesUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  /** Mescla o patch sobre o que já está salvo; seções não enviadas são preservadas. */
  async execute(userId: string, patch: PreferencesPatch) {
    const record = await this.profiles.findById(userId);
    if (!record) throw new NotFoundError("Usuário não encontrado");

    const current = resolvePreferences(record.preferences);
    const next = {
      notifications: { ...current.notifications, ...patch.notifications },
      security: { ...current.security, ...patch.security },
    };
    await this.profiles.savePreferences(userId, next);
    return next;
  }
}
