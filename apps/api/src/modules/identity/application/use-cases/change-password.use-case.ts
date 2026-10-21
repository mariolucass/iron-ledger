import bcrypt from "bcryptjs";
import { AppError } from "../../../../shared/errors/domain.error";
import { NotFoundError } from "../../../../shared/errors/not-found.error";
import type { ProfileRepository } from "../profile";

const BCRYPT_ROUNDS = 12;

export type ChangePasswordInput = { currentPassword: string; newPassword: string };

export class ChangePasswordUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(userId: string, input: ChangePasswordInput) {
    const currentHash = await this.profiles.findPasswordHash(userId);
    if (!currentHash) throw new NotFoundError("Usuário não encontrado");

    // 400 (e não 401): o BFF trata 401 como sessão expirada e derrubaria o login.
    if (!(await bcrypt.compare(input.currentPassword, currentHash))) {
      throw new AppError("A senha atual está incorreta", 400, "INVALID_CURRENT_PASSWORD");
    }
    if (input.currentPassword === input.newPassword) {
      throw new AppError("A nova senha deve ser diferente da atual", 400, "PASSWORD_UNCHANGED");
    }

    await this.profiles.savePasswordHash(userId, await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS));
    return { changed: true as const };
  }
}
