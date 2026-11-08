import { existsSync } from "node:fs";
import { amqpReady, hostPort, reachable } from "../lib/net.mjs";
import { pnpmInvocation } from "../lib/process.mjs";
import { paint } from "../lib/terminal.mjs";
import { analyticsDatabase, analyticsDir, apps, venvPython } from "../lib/workspace.cjs";

const pnpmService = (name, label, url, preflight) => ({
  label,
  url,
  preflight,
  launch: (script) =>
    pnpmInvocation(["--reporter=silent", "--filter", apps[name].filter, "run", script]),
});

/**
 * Cada serviço declara como iniciar (`launch`) e o que precisa para subir (`preflight`).
 * O preflight devolve `{ skip, blocking }` (não sobe), `{ warn }` (sobe com aviso) ou `{}`;
 * `blocking` marca o que impede o serviço até quando pedido sozinho e `abort` cancela
 * o comando inteiro (dependência obrigatória ausente), mesmo dentro de um grupo.
 */
export const services = {
  api: pnpmService(
    "api",
    "API · saúde",
    (env) => `http://localhost:${env.PORT}/health`,
    async ({ env, script, requested }) => {
      if (script === "dev" && (await reachable({ host: "127.0.0.1", port: Number(env.PORT) }))) {
        let existingApi = false;
        try {
          const response = await fetch(`http://127.0.0.1:${env.PORT}/health`, {
            signal: AbortSignal.timeout(1000),
          });
          existingApi = (await response.json()).service === "iron-ledger-api";
        } catch {
          // A porta pode pertencer a outro serviço.
        }
        const message = existingApi
          ? requested.length > 1
            ? `API já ativa na porta ${env.PORT} — reutilizando a instância existente`
            : `API já ativa na porta ${env.PORT} — não é necessário iniciar outra instância`
          : `porta ${env.PORT} ocupada por outro processo — altere API_PORT no .env ou libere a porta`;
        return { skip: message, blocking: !existingApi || requested.length === 1 };
      }
      const needsBroker = env.EVENT_BUS !== "memory";
      const dependencies = [];
      if (env.DATABASE_URL) dependencies.push(["PostgreSQL", hostPort(env.DATABASE_URL, 5432)]);
      if (needsBroker && env.RABBITMQ_URL)
        dependencies.push(["RabbitMQ", hostPort(env.RABBITMQ_URL, 5672), amqpReady]);
      const checks = await Promise.all(
        dependencies.map(async ([label, address, ready = reachable]) => {
          const ok = await ready(address);
          return {
            label,
            target: `${address.host}:${address.port}`,
            ok,
            // Porta aberta, mas o serviço ainda não completou o handshake.
            starting: !ok && ready !== reachable && (await reachable(address)),
          };
        }),
      );
      const missing = checks.filter(({ ok }) => !ok).map(({ label }) => label);
      if (!missing.length) return {};
      // A API não sobe sem essas dependências: aborta o comando inteiro, mesmo dentro de um grupo.
      return {
        skip: `${missing.join(" e ")} indisponível`,
        blocking: true,
        abort: true,
        report: {
          title: "A API não pode iniciar",
          summary: checks.some(({ starting }) => starting)
            ? "O RabbitMQ aceitou a conexão, mas ainda está iniciando. Aguarde alguns segundos e rode o comando de novo."
            : `${missing.join(" e ")} não ${missing.length > 1 ? "responderam" : "respondeu"}. A API precisa ${
                missing.length > 1 ? "deles" : "dele"
              } para subir, então nada foi iniciado.`,
          checks,
          steps: needsBroker
            ? [
                { command: "pnpm infra:core", hint: "sobe PostgreSQL e RabbitMQ via Docker" },
                { command: "pnpm dev:lite", hint: "alternativa sem RabbitMQ (eventos em memória)" },
              ]
            : [{ command: "pnpm infra:db", hint: "sobe o PostgreSQL via Docker" }],
        },
      };
    },
  ),

  web: pnpmService(
    "web",
    "Web",
    (env) => `http://localhost:${env.PORT}`,
    async ({ env, requested, script }) => {
      if (script === "dev" && (await reachable({ host: "127.0.0.1", port: Number(env.PORT) }))) {
        return {
          skip: `porta ${env.PORT} do web já está ocupada — altere WEB_PORT no .env ou libere a porta`,
          blocking: true,
        };
      }
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

/** Cor de cada serviço nos logs, tirada dos tokens de gráfico do web (--chart-1..4). */
const serviceTokens = { api: "info", web: "purple", worker: "primary", analytics: "warning" };
export const serviceColor = (name) => paint(serviceTokens[name] ?? "muted");
