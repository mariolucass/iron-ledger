import { loadWorkspaceEnv } from "../lib/app-env.cjs";
import { runPnpmSync } from "../lib/process.mjs";
import { bold, gray, teal } from "../lib/terminal.mjs";
import { panel, spinner, statusLine, stepLines } from "../lib/ui.mjs";
import { printDevBanner } from "./banner.mjs";
import { resolveOccupiedPorts } from "./occupied-port.mjs";
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

/**
 * Falhas esperadas e acionáveis (infra fora do ar, uso incorreto) saem com código 0 após
 * explicar o que fazer: com código ≠ 0 o pnpm acrescenta o ruído "ELIFECYCLE Command failed".
 * Defina IRON_LEDGER_STRICT_EXIT=1 para sair com 1 (útil em CI ou scripts encadeados).
 */
function exitWith(output, { code = 1 } = {}) {
  console.error(output);
  process.exit(process.env.IRON_LEDGER_STRICT_EXIT ? code : 0);
}

const usageError = (title, lines) => exitWith(panel({ tone: "error", title, body: lines }));

if (!/^[a-zA-Z0-9:_-]+$/.test(script)) {
  usageError("Script inválido", [
    `O nome ${bold(script)} contém caracteres não permitidos.`,
    gray("Use apenas letras, números, :, _ e -."),
  ]);
}

const preset = presets[target];
const requested = preset ? preset.apps : [target];
const grouped = requested.length > 1;

if (!requested.every(isKnownService)) {
  usageError("Serviço desconhecido", [
    `${bold(String(target))} não é um serviço nem um preset.`,
    "",
    `${gray("Opções:")} ${[...Object.keys(services), ...Object.keys(presets)].map((name) => teal(name)).join(gray(" · "))}`,
  ]);
}

// Os pacotes compartilhados (logger, event-bus, shared-types) são consumidos a partir de dist/.
if (needsPackagesBuild(requested)) {
  const progress = spinner("Compilando pacotes compartilhados");
  const build = runPnpmSync(["--filter", "./packages/**", "--if-present", "run", "build"], {
    capture: true,
  });
  if (build.status !== 0) {
    progress.fail("Falha ao compilar os pacotes compartilhados");
    const log = `${build.stdout ?? ""}${build.stderr ?? ""}`
      .trim()
      .split("\n")
      .slice(-25)
      .join("\n");
    if (log) console.error(`\n${gray(log)}`);
    exitWith(
      panel({
        tone: "error",
        title: "Build dos pacotes falhou",
        body: [
          "Os pacotes compartilhados (logger, event-bus, shared-types) não compilaram.",
          "",
          gray("Corrija o erro acima e rode o comando novamente."),
        ],
      }),
      { code: build.status ?? 1 },
    );
  }
  progress.succeed("Pacotes compartilhados compilados");
}

const environments = Object.fromEntries(
  requested.map((name) => [name, { ...loadWorkspaceEnv(name), ...preset?.env[name] }]),
);

if (script === "dev") await resolveOccupiedPorts(requested, environments);

const checks = await Promise.all(
  requested.map((name) => preflight(name, { env: environments[name], script, requested })),
);

// `abort` (dependência obrigatória ausente) cancela tudo; fora isso, `blocking` impede só um
// serviço pedido sozinho — dentro de um grupo, o serviço é apenas pulado.
const blocked = checks.find((check) => check.abort || (check.blocking && !grouped));
if (blocked) {
  const { report } = blocked;
  exitWith(
    report
      ? panel({
          tone: "error",
          title: report.title,
          body: [
            report.summary,
            "",
            ...report.checks.map(statusLine),
            "",
            bold("Como resolver"),
            ...stepLines(report.steps),
          ],
        })
      : panel({ tone: "error", title: "Não foi possível iniciar", body: [blocked.skip] }),
  );
}

const selected = requested.filter((_, index) => !grouped || !checks[index].skip);
const notices = requested
  .map((name, index) => [name, checks[index]])
  .filter(([, check]) => check.skip || check.warn);

if (script === "dev") {
  await printDevBanner({ requested, selected, notices, environments, note: preset?.note });
}

process.exitCode = await supervise(
  selected.map((name) => ({
    name,
    env: environments[name],
    launch: services[name].launch(script),
  })),
  { isolateFailures: grouped },
);
