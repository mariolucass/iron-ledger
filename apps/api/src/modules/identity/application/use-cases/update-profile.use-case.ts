import { NotFoundError } from "../../../../shared/errors/not-found.error";
import { toProfile, type ProfileRepository } from "../profile";

export type UpdateProfileInput = {
  name?: string;
  avatarUrl?: string | null;
  locale?: string;
  timezone?: string;
};

export class UpdateProfileUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(userId: string, input: UpdateProfileInput) {
    if (!(await this.profiles.findById(userId))) throw new NotFoundError("Usuário não encontrado");
    return toProfile(await this.profiles.update(userId, input));
  }
}
