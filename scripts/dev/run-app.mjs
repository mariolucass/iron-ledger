import { loadWorkspaceEnv } from "../lib/app-env.cjs";
import { runPnpmSync } from "../lib/process.mjs";
import { printDevBanner } from "./banner.mjs";
import { isKnownService, needsPackagesBuild, preflight, services } from "./services.mjs";
import { supervise } from "./supervisor.mjs";

const [target, script = "dev"] = process.argv.slice(2);

/**
 * Presets agrupam serviços e fixam o que o grupo dispensa:
 * - lite: API + Web sem RabbitMQ (EVENT_BUS=memory); só PostgreSQL é necessário.
 * - all:  tudo; serviços sem dependência disponível são pulados com instrução.
 */
const presets = {
  lite: {
    apps: ["api", "web"],
    env: { api: { EVENT_BUS: "memory" } },
    note: "Modo lite: eventos em memória (sem RabbitMQ). Precisa só do PostgreSQL.",
  },
  all: { apps: ["api", "web", "worker", "analytics"], env: {} },
};

function exitWith(message) {
  console.error(message);
  process.exit(1);
}

if (!/^[a-zA-Z0-9:_-]+$/.test(script)) exitWith("Nome de script invalido.");

const preset = presets[target];
const requested = preset ? preset.apps : [target];
const grouped = requested.length > 1;

if (!requested.every(isKnownService)) {
  exitWith(
    `Uso: node scripts/dev/run-app.mjs <${[...Object.keys(services), ...Object.keys(presets)].join("|")}> [script]`,
  );
}

// Os pacotes compartilhados (logger, event-bus, shared-types) são consumidos a partir de dist/.
if (needsPackagesBuild(requested)) {
  const build = runPnpmSync(["--filter", "./packages/**", "--if-present", "run", "build"]);
  if (build.status !== 0) {
    console.error("Falha ao compilar os pacotes compartilhados.");
    process.exit(build.status ?? 1);
  }
}

const environments = Object.fromEntries(
  requested.map((name) => [name, { ...loadWorkspaceEnv(name), ...preset?.env[name] }]),
);

const checks = await Promise.all(
  requested.map((name) => preflight(name, { env: environments[name], script, requested })),
);

// Um serviço pedido sozinho sobe mesmo com dependências ausentes (só `blocking` o impede);
// pular faz sentido apenas dentro de um grupo.
const blocked = checks.find((check) => check.blocking && !grouped);
if (blocked) exitWith(blocked.skip);

const selected = requested.filter((_, index) => !grouped || !checks[index].skip);
const notices = requested
  .map((name, index) => [name, checks[index]])
  .filter(([, check]) => check.skip || check.warn);

if (script === "dev") {
  printDevBanner({ selected, notices, environments, note: preset?.note });
}

process.exitCode = await supervise(
  selected.map((name) => ({
    name,
    env: environments[name],
    launch: services[name].launch(script),
  })),
  { isolateFailures: grouped },
);
