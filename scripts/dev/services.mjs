import { existsSync } from "node:fs";
import { hostPort, reachable } from "../lib/net.mjs";
import { pnpmInvocation } from "../lib/process.mjs";
import { analyticsDatabase, analyticsDir, apps, venvPython } from "../lib/workspace.cjs";

const pnpmService = (name, label, url, preflight) => ({
  label,
  url,
  preflight,
  launch: (script) => pnpmInvocation(["--filter", apps[name].filter, "run", script]),
});

/**
 * Cada serviço declara como iniciar (`launch`) e o que precisa para subir (`preflight`).
 * O preflight devolve `{ skip, blocking }` (não sobe), `{ warn }` (sobe com aviso) ou `{}`;
 * `blocking` marca o que impede o serviço até quando pedido sozinho.
 */
export const services = {
  api: pnpmService(
    "api",
    "API · saúde",
    (env) => `http://localhost:${env.PORT}/health`,
    async ({ env }) => {
      const missing = [];
      if (env.DATABASE_URL && !(await reachable(hostPort(env.DATABASE_URL, 5432))))
        missing.push("PostgreSQL");
      const needsBroker = env.EVENT_BUS !== "memory";
      if (needsBroker && env.RABBITMQ_URL && !(await reachable(hostPort(env.RABBITMQ_URL, 5672))))
        missing.push("RabbitMQ");
      if (!missing.length) return {};
      const fix = needsBroker
        ? "pnpm infra:core (ou pnpm dev:lite, sem RabbitMQ)"
        : "pnpm infra:db";
      return { warn: `${missing.join(" e ")} indisponível — rode ${fix}` };
    },
  ),

  web: pnpmService(
    "web",
    "Web",
    (env) => `http://localhost:${env.PORT}`,
    async ({ env, requested }) => {
      if (requested.includes("api")) return {};
      const api = hostPort(env.API_URL ?? "", Number(env.API_PORT ?? 3000));
      if (await reachable(api)) return {};
      return {
        warn: `API indisponível em ${api.host}:${api.port} — login e dados falham; rode pnpm dev:lite`,
      };
    },
  ),

  worker: pnpmService(
    "worker",
    "Worker Temporal",
    () => "sem interface web",
    async ({ env }) => {
      const temporal = hostPort(env.TEMPORAL_ADDRESS ?? "localhost:7233", 7233);
      if (await reachable(temporal)) return {};
      return {
        skip: `Temporal indisponível em ${temporal.host}:${temporal.port} — rode pnpm infra:platform e confira pnpm infra:status`,
      };
    },
  ),

  // Serviço Python: fora do workspace pnpm, roda pelo .venv do próprio serviço.
  analytics: {
    label: "Analytics",
    scripts: ["dev"],
    url: (env) => `http://localhost:${env.ANALYTICS_PORT ?? "8000"}/docs`,
    launch: () => ({
      command: venvPython(analyticsDir),
      args: ["main.py"],
      shell: false,
      cwd: analyticsDir,
    }),
    async preflight({ env }) {
      if (!existsSync(venvPython(analyticsDir))) {
        return { skip: "ambiente Python ausente — rode pnpm setup:python", blocking: true };
      }
      const port = Number(env.ANALYTICS_PORT ?? 8000);
      if (await reachable({ host: "localhost", port })) {
        return {
          skip: `porta ${port} já em uso (container analytics? pnpm infra:down ou docker compose stop analytics)`,
        };
      }
      if (!existsSync(analyticsDatabase)) {
        return {
          warn: "sem dados da Olist — rode pnpm setup:all ou python -m src.cli download && run",
        };
      }
      return {};
    },
  },
};

export const isKnownService = (name) => Object.hasOwn(services, name);

/** Serviços do workspace pnpm dependem dos pacotes compartilhados compilados em dist/. */
export const needsPackagesBuild = (names) => names.some((name) => apps[name].filter);

export async function preflight(name, context) {
  const service = services[name];
  if (service.scripts && !service.scripts.includes(context.script)) {
    return { skip: `não possui o script "${context.script}"` };
  }
  return (await service.preflight?.(context)) ?? {};
}
