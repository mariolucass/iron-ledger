import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createConnection } from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadAppEnv, loadWorkspaceEnv } from "./app-env.cjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const app = process.argv[2];
const script = process.argv[3] ?? "dev";
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

if (!/^[a-zA-Z0-9:_-]+$/.test(script)) {
  console.error("Nome de script invalido.");
  process.exit(1);
}

const definitions = {
  api: {
    filter: "@iron-ledger/api",
  },
  web: {
    filter: "@iron-ledger/web",
  },
  worker: {
    filter: "@iron-ledger/temporal-worker",
  },
  // Serviço Python: fora do workspace pnpm, roda pelo .venv do próprio serviço.
  analytics: {
    command: process.execPath,
    args: [path.join(rootDir, "scripts", "run-analytics.mjs")],
    scripts: ["dev"],
  },
};

const requested = app === "all" ? ["api", "web", "worker", "analytics"] : [app];

if (requested.some((name) => !definitions[name])) {
  console.error("Uso: node scripts/run-app.mjs <api|web|worker|analytics|all> [script]");
  process.exit(1);
}

// Os pacotes compartilhados (logger, event-bus, shared-types) são consumidos a partir de dist/.
const prebuild = spawnSync(
  process.platform === "win32" ? `${pnpm} --filter "./packages/**" --if-present run build` : pnpm,
  process.platform === "win32" ? [] : ["--filter", "./packages/**", "--if-present", "run", "build"],
  { cwd: rootDir, stdio: "inherit", shell: process.platform === "win32" },
);
if (prebuild.status !== 0) {
  console.error("Falha ao compilar os pacotes compartilhados.");
  process.exit(prebuild.status ?? 1);
}

const environments = Object.fromEntries(requested.map((name) => [name, loadWorkspaceEnv(name)]));

function hostPort(address, fallbackPort) {
  try {
    const url = new URL(address.includes("://") ? address : `tcp://${address}`);
    return { host: url.hostname || "localhost", port: Number(url.port || fallbackPort) };
  } catch {
    return { host: "localhost", port: Number(fallbackPort) };
  }
}

function reachable({ host, port }, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

/**
 * Em "all", um serviço cuja dependência obrigatória falta é pulado com instrução,
 * em vez de subir e cair. Dependências da API apenas geram aviso.
 */
async function preflight(name, env) {
  const definition = definitions[name];
  if (definition.scripts && !definition.scripts.includes(script)) {
    return { skip: `não possui o script "${script}"` };
  }
  if (name === "worker") {
    const temporal = hostPort(env.TEMPORAL_ADDRESS ?? "localhost:7233", 7233);
    if (!(await reachable(temporal))) {
      return {
        skip: `Temporal indisponível em ${temporal.host}:${temporal.port} — rode pnpm infra:platform e confira pnpm infra:status`,
      };
    }
  }
  if (name === "analytics") {
    const service = path.join(rootDir, "services", "analytics");
    const python = path.join(
      service,
      ".venv",
      process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
    );
    if (!existsSync(python)) return { skip: "ambiente Python ausente — rode pnpm setup:python" };
    const port = Number(env.ANALYTICS_PORT ?? 8000);
    if (await reachable({ host: "localhost", port })) {
      return {
        skip: `porta ${port} já em uso (container analytics? pnpm infra:down ou docker compose stop analytics)`,
      };
    }
    const database = path.join(service, "data", "processed", "analytics.db");
    if (!existsSync(database)) {
      return {
        warn: "sem dados da Olist — rode pnpm setup:all ou python -m src.cli download && run",
      };
    }
  }
  if (name === "api") {
    const missing = [];
    if (env.DATABASE_URL && !(await reachable(hostPort(env.DATABASE_URL, 5432))))
      missing.push("PostgreSQL");
    if (env.RABBITMQ_URL && !(await reachable(hostPort(env.RABBITMQ_URL, 5672))))
      missing.push("RabbitMQ");
    if (missing.length)
      return { warn: `${missing.join(" e ")} indisponível — rode pnpm infra:core` };
  }
  return {};
}

const checks =
  app === "all"
    ? await Promise.all(requested.map((name) => preflight(name, environments[name])))
    : requested.map(() => ({}));
const selected = requested.filter((_, index) => !checks[index].skip);
const notices = requested
  .map((name, index) => [name, checks[index]])
  .filter(([, check]) => check.skip || check.warn);

if (script === "dev") {
  const dockerEnv = loadAppEnv(path.join(rootDir, ".env"), null);
  const dockerPort = (key, fallback) => dockerEnv[key] || fallback;
  const color = process.stdout.isTTY && !process.env.NO_COLOR;
  const cyan = (value) => (color ? `\u001b[36m${value}\u001b[0m` : value);
  const bold = (value) => (color ? `\u001b[1m${value}\u001b[0m` : value);
  const services = {
    api: ["API · saúde", (env) => `http://localhost:${env.PORT}/health`],
    web: ["Web", (env) => `http://localhost:${env.PORT}`],
    worker: ["Worker Temporal", () => "sem interface web"],
    analytics: ["Analytics", (env) => `http://localhost:${env.ANALYTICS_PORT ?? "8000"}/docs`],
  };
  const yellow = (value) => (color ? `\u001b[33m${value}\u001b[0m` : value);

  console.log(`\n  ${bold("Iron Ledger · desenvolvimento")}\n`);
  for (const name of selected) {
    const [label, address] = services[name];
    console.log(`  ${label.padEnd(17)} ${cyan(address(environments[name]))}`);
  }
  if (notices.length) {
    console.log(`\n  ${bold("Atenção")}\n`);
    for (const [name, check] of notices) {
      const status = check.skip ? "não iniciado" : "aviso";
      console.log(
        `  ${yellow(`${services[name][0]} (${status})`.padEnd(30))} ${check.skip ?? check.warn}`,
      );
    }
  }
  console.log(`\n  ${bold("Interfaces Docker (quando iniciadas)")}\n`);
  const interfaces = [
    ["RabbitMQ", `http://localhost:${dockerPort("RABBITMQ_MANAGEMENT_PORT", "15672")}`, "core"],
    ["Temporal UI", `http://localhost:${dockerPort("TEMPORAL_UI_PORT", "8088")}`, "platform"],
    ["Jaeger", `http://localhost:${dockerPort("JAEGER_UI_PORT", "16686")}`, "observability"],
  ];
  for (const [label, url, profile] of interfaces) {
    console.log(`  ${label.padEnd(17)} ${cyan(url)}  (${profile})`);
  }
  console.log(`\n  ${bold("Serviços sem interface web")}\n`);
  console.log(`  Redis             localhost:${dockerPort("REDIS_PORT", "6379")}`);
  console.log(`  PostgreSQL        localhost:${dockerPort("POSTGRES_PORT", "5432")}`);
  console.log(`  Kafka             localhost:${dockerPort("KAFKA_PORT", "9092")}  (platform)`);
  console.log("\n  Pressione Ctrl+C para encerrar.\n");
}

const children = selected.map((name) => {
  const definition = definitions[name];
  const childEnv = environments[name];

  let command;
  let args;
  if (definition.command) {
    command = definition.command;
    args = definition.args;
  } else {
    command =
      process.platform === "win32" ? `pnpm --filter ${definition.filter} run ${script}` : pnpm;
    args = process.platform === "win32" ? [] : ["--filter", definition.filter, "run", script];
  }

  const child = spawn(command, args, {
    cwd: rootDir,
    env: childEnv,
    shell: process.platform === "win32",
    stdio: "inherit",
    detached: process.platform !== "win32",
  });
  child.appName = name;
  return child;
});

let exitCode = 0;
let shuttingDown = false;

function signalTree(child, signal) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }
  try {
    // pnpm inicia outros processos; o grupo inclui Next, tsx e seus filhos.
    process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") console.error(error);
  }
}

function stopChildren() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    signalTree(child, "SIGTERM");
  }
  // Um processo que ignora SIGTERM não deve manter a porta ocupada.
  if (process.platform !== "win32") {
    setTimeout(() => {
      for (const child of children) signalTree(child, "SIGKILL");
    }, 5000);
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, stopChildren);
}

await Promise.all(
  children.map(
    (child) =>
      new Promise((resolve) => {
        child.on("error", (error) => {
          console.error(error);
          exitCode = 1;
          stopChildren();
          resolve();
        });
        child.on("exit", (code, signal) => {
          if (code && code !== 0) exitCode = code;
          // Em "all", a queda de um serviço não derruba os demais.
          if (!shuttingDown && app === "all" && children.length > 1) {
            console.error(
              `\n[dev] ${child.appName} encerrou (código ${code ?? signal}); demais serviços seguem ativos.\n`,
            );
          } else if (!shuttingDown) {
            stopChildren();
          }
          resolve();
        });
      }),
  ),
);

process.exitCode = exitCode;
