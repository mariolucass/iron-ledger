import { spawn, spawnSync } from "node:child_process";
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
};

const selected = app === "all" ? ["api", "web"] : [app];

if (selected.some((name) => !definitions[name])) {
  console.error("Uso: node scripts/run-app.mjs <api|web|worker|all> [script]");
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

const environments = Object.fromEntries(selected.map((name) => [name, loadWorkspaceEnv(name)]));

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
  };

  console.log(`\n  ${bold("Iron Ledger · desenvolvimento")}\n`);
  for (const name of selected) {
    const [label, address] = services[name];
    console.log(`  ${label.padEnd(17)} ${cyan(address(environments[name]))}`);
  }
  console.log(`\n  ${bold("Interfaces Docker (quando iniciadas)")}\n`);
  const interfaces = [
    ["RabbitMQ", `http://localhost:${dockerPort("RABBITMQ_MANAGEMENT_PORT", "15672")}`, "core"],
    ["Temporal UI", `http://localhost:${dockerPort("TEMPORAL_UI_PORT", "8088")}`, "platform"],
    ["Analytics", `http://localhost:${dockerPort("ANALYTICS_PORT", "8000")}/docs`, "analytics"],
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

  const command =
    process.platform === "win32" ? `pnpm --filter ${definition.filter} run ${script}` : pnpm;
  const args = process.platform === "win32" ? [] : ["--filter", definition.filter, "run", script];

  return spawn(command, args, {
    cwd: rootDir,
    env: childEnv,
    shell: process.platform === "win32",
    stdio: "inherit",
    detached: process.platform !== "win32",
  });
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
          if (!shuttingDown) stopChildren();
          resolve();
        });
      }),
  ),
);

process.exitCode = exitCode;
