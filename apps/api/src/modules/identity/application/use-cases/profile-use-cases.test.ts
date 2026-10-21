import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import type { ProfileRecord, ProfileRepository } from "../profile";
import { ChangePasswordUseCase } from "./change-password.use-case";
import { GetProfileUseCase } from "./get-profile.use-case";
import { UpdatePreferencesUseCase } from "./update-preferences.use-case";
import { UpdateProfileUseCase } from "./update-profile.use-case";

function setup(overrides: Partial<ProfileRecord> = {}, passwordHash = "") {
  const state = {
    record: {
      id: "u1", email: "a@b.com", name: "Ana", avatarUrl: null, locale: "pt-BR",
      timezone: "America/Sao_Paulo", roles: ["ADMIN"], preferences: null, ...overrides,
    } as ProfileRecord,
    passwordHash,
  };
  const repo: ProfileRepository = {
    findById: async (id) => (id === state.record.id ? state.record : null),
    update: async (_id, data) => (state.record = { ...state.record, ...data }),
    savePreferences: async (_id, preferences) => void (state.record = { ...state.record, preferences }),
    findPasswordHash: async (id) => (id === state.record.id ? state.passwordHash : null),
    savePasswordHash: async (_id, hash) => void (state.passwordHash = hash),
  };
  return { state, repo };
}

describe("perfil", () => {
  it("aplica preferências padrão quando nada foi salvo", async () => {
    const { repo } = setup();
    const profile = await new GetProfileUseCase(repo).execute("u1");
    expect(profile.preferences).toEqual({
      notifications: { emailAlerts: true, slackAlerts: false },
      security: { strictIp: false, allowedIps: [] },
    });
  });

  it("atualiza apenas os campos enviados", async () => {
    const { repo } = setup();
    const profile = await new UpdateProfileUseCase(repo).execute("u1", { name: "Ana Souza" });
    expect(profile).toMatchObject({ name: "Ana Souza", timezone: "America/Sao_Paulo" });
  });

  it("mescla preferências preservando as seções não enviadas", async () => {
    const { repo, state } = setup();
    const useCase = new UpdatePreferencesUseCase(repo);
    await useCase.execute("u1", { security: { allowedIps: ["10.0.0.1"] } });
    const next = await useCase.execute("u1", { notifications: { slackAlerts: true } });
    expect(next.security.allowedIps).toEqual(["10.0.0.1"]);
    expect(next.notifications).toEqual({ emailAlerts: true, slackAlerts: true });
    expect(state.record.preferences).toEqual(next);
  });

  it("falha com 404 para usuário inexistente", async () => {
    const { repo } = setup();
    await expect(new GetProfileUseCase(repo).execute("x")).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("ChangePasswordUseCase", () => {
  it("troca a senha quando a atual confere", async () => {
    const { repo, state } = setup({}, await bcrypt.hash("SenhaAtual123", 4));
    await new ChangePasswordUseCase(repo).execute("u1", { currentPassword: "SenhaAtual123", newPassword: "NovaSenha456" });
    expect(await bcrypt.compare("NovaSenha456", state.passwordHash)).toBe(true);
  });

  it("rejeita senha atual incorreta com 400 (nunca 401)", async () => {
    const { repo } = setup({}, await bcrypt.hash("SenhaAtual123", 4));
    await expect(
      new ChangePasswordUseCase(repo).execute("u1", { currentPassword: "errada", newPassword: "NovaSenha456" }),
    ).rejects.toMatchObject({ statusCode: 400, code: "INVALID_CURRENT_PASSWORD" });
  });

  it("rejeita nova senha igual à atual", async () => {
    const { repo } = setup({}, await bcrypt.hash("SenhaAtual123", 4));
    await expect(
      new ChangePasswordUseCase(repo).execute("u1", { currentPassword: "SenhaAtual123", newPassword: "SenhaAtual123" }),
    ).rejects.toMatchObject({ code: "PASSWORD_UNCHANGED" });
  });
});
