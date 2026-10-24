import { Socket } from "node:net";
import { prisma } from "../../../../infra/database/prisma.client";
import type { EventBus } from "../../../../infra/messaging/rabbitmq.client";
import type { ServiceStatus, ServicesProbe } from "../../application/platform";

const TIMEOUT_MS = 3_000;

export interface PlatformServicesConfig {
  eventBusDriver: "rabbitmq" | "memory";
  rabbitMqUrl?: string;
  outboxRelayEnabled: boolean;
  outboxPollIntervalMs: number;
  temporal: { address: string; namespace: string; taskQueue: string };
  /** Consulta o servidor Temporal e devolve quantos workers fazem polling na task queue. */
  temporalHealth?: () => Promise<{ pollers: number }>;
  kafkaBrokers: string[];
  analyticsUrl: string;
}

function withTimeout<T>(promise: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Sem resposta em ${ms} ms.`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** `fetch` só diz "fetch failed"; o motivo real (ECONNREFUSED etc.) fica em `cause`. */
const message = (error: unknown): string => {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause as { code?: string } | undefined;
  return cause?.code ? `${error.message} (${cause.code})` : error.message;
};

/** Mede a latência de `run`; uma falha vira `down` com a mensagem do erro. */
async function timed<T>(run: () => Promise<T>): Promise<{ ok: true; value: T; latencyMs: number } | { ok: false; error: string }> {
  const started = performance.now();
  try {
    const value = await withTimeout(run());
    return { ok: true, value, latencyMs: Math.round(performance.now() - started) };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

function tcpReachable(host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    socket.setTimeout(TIMEOUT_MS);
    socket.once("connect", () => {
      socket.destroy();
      resolve();
    });
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error(`Sem resposta de ${host}:${port}.`));
    });
    socket.once("error", (error) => {
      socket.destroy();
      reject(error);
    });
    socket.connect(port, host);
  });
}

function hostPort(value: string, defaultPort: number): { host: string; port: number } {
  const [host, port] = value.trim().split(":");
  return { host: host || "localhost", port: Number(port) || defaultPort };
}

/** Host e porta do broker, sem credenciais. */
function rabbitMqEndpoint(url: string): { host: string; port: number } {
  const parsed = new URL(url);
  return { host: parsed.hostname, port: Number(parsed.port) || (parsed.protocol === "amqps:" ? 5671 : 5672) };
}

/**
 * Verifica ao vivo as dependências da API. Cada checagem tem timeout próprio e
 * nunca lança: uma dependência fora do ar aparece como `down`, não como erro HTTP.
 */
export class PlatformServicesProbe implements ServicesProbe {
  constructor(
    private readonly eventBus: EventBus,
    private readonly config: PlatformServicesConfig,
  ) {}

  async check() {
    const services = await Promise.all([
      this.postgres(),
      this.eventBusStatus(),
      this.rabbitMq(),
      this.outboxRelay(),
      this.temporalStatus(),
      this.kafka(),
      this.analytics(),
    ]);
    return { checkedAt: new Date().toISOString(), services };
  }

  private async postgres(): Promise<ServiceStatus> {
    const result = await timed(() => prisma.$queryRaw`SELECT 1`);
    return {
      key: "postgres",
      name: "PostgreSQL",
      role: "Banco transacional: domínio, outbox, inbox e auditoria.",
      optional: false,
      status: result.ok ? "up" : "down",
      latencyMs: result.ok ? result.latencyMs : null,
      error: result.ok ? null : result.error,
      details: [{ label: "Acesso", value: "Prisma" }],
    };
  }

  private async eventBusStatus(): Promise<ServiceStatus> {
    const memory = this.config.eventBusDriver === "memory";
    return {
      key: "eventBus",
      name: "Event bus",
      role: "Publica eventos de domínio e entrega aos consumidores (auditoria, inbox).",
      optional: false,
      status: memory ? "degraded" : this.rabbitMqConnected() ? "up" : "down",
      latencyMs: null,
      error: memory ? "Driver em memória: eventos não sobrevivem a reinício nem saem deste processo." : null,
      details: [
        { label: "Driver", value: memory ? "Em memória" : "RabbitMQ" },
        { label: "Exchange", value: this.eventBus.exchange },
      ],
    };
  }

  private async rabbitMq(): Promise<ServiceStatus> {
    const base = {
      key: "rabbitmq",
      name: "RabbitMQ",
      role: "Broker AMQP do event bus, com filas duráveis e dead-letter.",
      optional: false,
    };
    if (this.config.eventBusDriver === "memory" || !this.config.rabbitMqUrl) {
      return {
        ...base,
        status: "disabled",
        latencyMs: null,
        error: null,
        details: [{ label: "Motivo", value: "EVENT_BUS=memory" }],
      };
    }
    const { host, port } = rabbitMqEndpoint(this.config.rabbitMqUrl);
    const result = await timed(() => tcpReachable(host, port));
    const connected = this.rabbitMqConnected();
    return {
      ...base,
      status: result.ok && connected ? "up" : "down",
      latencyMs: result.ok ? result.latencyMs : null,
      error: !result.ok ? result.error : connected ? null : "Canal AMQP da API não está aberto.",
      details: [
        { label: "Endereço", value: `${host}:${port}` },
        { label: "Canal da API", value: connected ? "Aberto" : "Fechado" },
      ],
    };
  }

  private async outboxRelay(): Promise<ServiceStatus> {
    const result = await timed(() =>
      prisma.outboxEvent.groupBy({
        by: ["status"],
        where: { status: { in: ["PENDING", "FAILED", "DEAD_LETTER"] } },
        _count: { _all: true },
      }),
    );
    const count = (status: string) =>
      result.ok ? String(result.value.find((row) => row.status === status)?._count._all ?? 0) : "—";
    const enabled = this.config.outboxRelayEnabled;
    const deadLetters = result.ok ? Number(count("DEAD_LETTER")) : 0;
    return {
      key: "outboxRelay",
      name: "Outbox relay",
      role: "Lê o outbox transacional e publica os eventos no event bus.",
      optional: false,
      status: !enabled ? "disabled" : !result.ok ? "down" : deadLetters > 0 ? "degraded" : "up",
      latencyMs: null,
      error: !result.ok ? result.error : deadLetters > 0 ? `${deadLetters} evento(s) em dead-letter.` : null,
      details: [
        { label: "Polling", value: `${this.config.outboxPollIntervalMs} ms` },
        { label: "Pendentes", value: count("PENDING") },
        { label: "Com falha", value: count("FAILED") },
        { label: "Dead-letter", value: count("DEAD_LETTER") },
      ],
    };
  }

  private async temporalStatus(): Promise<ServiceStatus> {
    const { address, namespace, taskQueue } = this.config.temporal;
    const details = [
      { label: "Endereço", value: address },
      { label: "Namespace", value: namespace },
      { label: "Task queue", value: taskQueue },
    ];
    const base = {
      key: "temporal",
      name: "Temporal",
      role: "Orquestra a saga de transações executada pelo temporal-worker.",
      optional: true,
    };
    const health = this.config.temporalHealth;
    if (!health) {
      return { ...base, status: "disabled", latencyMs: null, error: null, details };
    }
    const result = await timed(health);
    if (!result.ok) {
      return { ...base, status: "down", latencyMs: null, error: result.error, details };
    }
    const { pollers } = result.value;
    return {
      ...base,
      status: pollers > 0 ? "up" : "degraded",
      latencyMs: result.latencyMs,
      error: pollers > 0 ? null : "Servidor no ar, mas nenhum worker consome a task queue.",
      details: [...details, { label: "Workers ativos", value: String(pollers) }],
    };
  }

  private async kafka(): Promise<ServiceStatus> {
    const brokers = this.config.kafkaBrokers;
    const result = await timed(() =>
      Promise.any(brokers.map((broker) => {
        const { host, port } = hostPort(broker, 9092);
        return tcpReachable(host, port);
      })),
    );
    return {
      key: "kafka",
      name: "Kafka",
      role: "Stream durável previsto para auditoria e analytics; ainda sem relay operacional.",
      optional: true,
      status: result.ok ? "up" : "down",
      latencyMs: result.ok ? result.latencyMs : null,
      error: result.ok ? null : "Nenhum broker respondeu (perfil Docker platform).",
      details: [
        { label: "Brokers", value: brokers.join(", ") },
        { label: "Integração", value: "Infraestrutura apenas" },
      ],
    };
  }

  private async analytics(): Promise<ServiceStatus> {
    const url = this.config.analyticsUrl.replace(/\/$/, "");
    const result = await timed(async () => {
      const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });
    return {
      key: "analytics",
      name: "Analytics",
      role: "Serviço Python de métricas, pontos de inflexão e previsão de demanda.",
      optional: true,
      status: result.ok ? "up" : "down",
      latencyMs: result.ok ? result.latencyMs : null,
      error: result.ok ? null : result.error,
      details: [{ label: "Endereço", value: url }],
    };
  }

  private rabbitMqConnected(): boolean {
    return "isConnected" in this.eventBus ? Boolean(this.eventBus.isConnected) : false;
  }
}
