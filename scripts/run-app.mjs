import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootEnv = path.join(rootDir, ".env");

if (existsSync(rootEnv)) {
  loadEnvFile(rootEnv);
}

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
    env: () => ({
      PORT: process.env.API_PORT ?? process.env.PORT ?? "3000",
    }),
  },
  web: {
    filter: "@iron-ledger/web",
    env: () => {
      const port = process.env.WEB_PORT ?? process.env.PORT ?? "3001";
      const apiUrl = process.env.API_URL ?? "http://localhost:3000";

      return {
        PORT: port,
        API_URL: apiUrl,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? apiUrl,
        NEXT_PUBLIC_APP_URL:
          process.env.NEXT_PUBLIC_APP_URL ?? process.env.WEB_URL ?? `http://localhost:${port}`,
      };
    },
  },
  worker: {
    filter: "@iron-ledger/temporal-worker",
    env: () => ({
      API_URL: process.env.API_URL ?? "http://localhost:3000",
      TEMPORAL_ADDRESS: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
      TEMPORAL_NAMESPACE: process.env.TEMPORAL_NAMESPACE ?? "default",
      TEMPORAL_TASK_QUEUE: process.env.TEMPORAL_TASK_QUEUE ?? "iron-ledger-tasks",
    }),
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

const children = selected.map((name) => {
  const definition = definitions[name];
  const childEnv = { ...process.env, ...definition.env() };
  const portLabel = childEnv.PORT ? ` na porta ${childEnv.PORT}` : "";
  console.log(`Iniciando ${name}${portLabel} com variaveis de ${rootEnv}`);

  const command =
    process.platform === "win32"
      ? `pnpm --filter ${definition.filter} run ${script}`
      : pnpm;
  const args = process.platform === "win32" ? [] : ["--filter", definition.filter, "run", script];

  return spawn(command, args, {
    cwd: rootDir,
    env: childEnv,
    shell: process.platform === "win32",
    stdio: "inherit",
  });
});

let exitCode = 0;
let shuttingDown = false;

function stopChildren(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.killed || child.exitCode !== null) continue;
    if (process.platform === "win32" && child.pid) {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    } else {
      child.kill(signal);
    }
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => stopChildren(signal));
}

await Promise.all(
  children.map(
    (child) =>
      new Promise((resolve) => {
        child.on("error", (error) => {
          console.error(error);
          exitCode = 1;
          stopChildren("SIGTERM");
          resolve();
        });
        child.on("exit", (code, signal) => {
          if (code && code !== 0) exitCode = code;
          if (!shuttingDown && (code !== 0 || signal)) stopChildren("SIGTERM");
          resolve();
        });
      }),
  ),
);

process.exitCode = exitCode;
