import { NotFoundError } from "../../../../shared/errors/not-found.error";
import { toProfile, type ProfileRepository } from "../profile";

export class GetProfileUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(userId: string) {
    const record = await this.profiles.findById(userId);
    if (!record) throw new NotFoundError("Usuário não encontrado");
    return toProfile(record);
  }
}
