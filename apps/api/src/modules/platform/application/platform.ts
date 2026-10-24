import { NotFoundError } from "../../../shared/errors/not-found.error";

export type PlatformSection =
  "outbox" | "inbox" | "idempotency-keys" | "settings" | "feature-flags";
export interface PlatformRepository {
  overview(): Promise<unknown>;
  list(section: PlatformSection, page: number, pageSize: number): Promise<unknown>;
  outbox(id: string): Promise<unknown | null>;
  flag(id: string): Promise<unknown | null>;
  createFlag(input: FlagInput, actorId: string): Promise<unknown>;
  updateFlag(id: string, input: Partial<FlagInput>, actorId: string): Promise<unknown | null>;
}
export interface FlagInput {
  key: string;
  description: string | null;
  isEnabled: boolean;
  rollout: number;
  rules: unknown | null;
}
export interface ServiceStatus {
  key: string;
  name: string;
  role: string;
  /** Dependência de perfil Docker opcional; a API funciona sem ela. */
  optional: boolean;
  status: "up" | "degraded" | "down" | "disabled";
  latencyMs: number | null;
  error: string | null;
  details: { label: string; value: string }[];
}
export interface ServicesProbe {
  check(): Promise<{ checkedAt: string; services: ServiceStatus[] }>;
}
export class PlatformUseCase {
  constructor(
    private readonly repository: PlatformRepository,
    private readonly probe?: ServicesProbe,
  ) {}
  overview() {
    return this.repository.overview();
  }
  services() {
    if (!this.probe) return Promise.resolve({ checkedAt: new Date().toISOString(), services: [] });
    return this.probe.check();
  }
  list(section: PlatformSection, page: number, pageSize: number) {
    return this.repository.list(section, page, pageSize);
  }
  async outbox(id: string) {
    const result = await this.repository.outbox(id);
    if (!result) throw new NotFoundError("Evento não encontrado.");
    return result;
  }
  async flag(id: string) {
    const result = await this.repository.flag(id);
    if (!result) throw new NotFoundError("Flag não encontrada.");
    return result;
  }
  createFlag(input: FlagInput, actorId: string) {
    return this.repository.createFlag(input, actorId);
  }
  async updateFlag(id: string, input: Partial<FlagInput>, actorId: string) {
    const result = await this.repository.updateFlag(id, input, actorId);
    if (!result) throw new NotFoundError("Flag não encontrada.");
    return result;
  }
}
