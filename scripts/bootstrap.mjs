import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cachePath = path.join(rootDir, ".bootstrap-cache.json");

const flags = new Set(process.argv.slice(2));
const onlyNode = flags.has("--node");
const onlyPython = flags.has("--python");
const installAll = flags.has("--all");
const assumeYes = installAll || flags.has("--yes") || flags.has("-y");
const forceReinstall = flags.has("--force");
const showHelp = flags.has("--help") || flags.has("-h");

const colors = process.stdout.isTTY
  ? {
      cyan: "\u001b[36m",
      green: "\u001b[32m",
      red: "\u001b[31m",
      yellow: "\u001b[33m",
      magenta: "\u001b[35m",
      blue: "\u001b[34m",
      gray: "\u001b[90m",
      bold: "\u001b[1m",
      reset: "\u001b[0m",
    }
  : {
      cyan: "",
      green: "",
      red: "",
      yellow: "",
      magenta: "",
      blue: "",
      gray: "",
      bold: "",
      reset: "",
    };

function warn(message) {
  console.log(`${colors.yellow}!${colors.reset} ${message}`);
}
function info(message) {
  console.log(`${colors.cyan}➜${colors.reset} ${message}`);
}
function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}
function fail(message) {
  console.error(`${colors.red}✗ ${message}${colors.reset}`);
}
function banner(text) {
  const line = "─".repeat(text.length + 2);
  console.log(`${colors.bold}${colors.cyan}┌${line}┐`);
  console.log(`│ ${text} │`);
  console.log(`└${line}┘${colors.reset}`);
}
function printHelp() {
  console.log(`
${colors.bold}Iron Ledger · Preparação do ambiente${colors.reset}

Uso:
  node scripts/bootstrap.mjs [opções]

Opções:
  --all       Instala tudo sem perguntar (Node.js + Python)
  --node      Instala apenas o workspace Node.js
  --python    Prepara apenas os serviços Python
  --yes, -y   Não pergunta nada (equivalente a --all quando sozinho)
  --force     Ignora o cache e reinstala mesmo sem mudanças
  --help, -h  Mostra esta ajuda
`);
}

function run(command, commandArgs, options = {}) {
  return spawnSync(command, commandArgs, {
    cwd: options.cwd ?? rootDir,
    encoding: "utf8",
    shell: false,
    stdio: options.capture ? "pipe" : "inherit",
  });
}

/** Non-blocking spawn with line-prefixed, tagged output — safe to run concurrently. */
function spawnAsync(command, commandArgs, { cwd, tag, color = colors.gray } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { cwd: cwd ?? rootDir, shell: false });
    const prefix = tag ? `${color}[${tag}]${colors.reset} ` : "";

    const pipeTagged = (stream, target) => {
      let buffer = "";
      stream.on("data", (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) target.write(`${prefix}${line}\n`);
      });
      stream.on("end", () => {
        if (buffer) target.write(`${prefix}${buffer}\n`);
      });
    };
    pipeTagged(child.stdout, process.stdout);
    pipeTagged(child.stderr, process.stderr);

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${commandArgs.join(" ")} saiu com código ${code}`));
    });
  });
}

function commandWorks(command, commandArgs) {
  return run(command, commandArgs, { capture: true }).status === 0;
}

function systemCommand(command, prefix = []) {
  if (process.platform !== "win32") return { command, prefix };
  return {
    command: process.env.ComSpec || "cmd.exe",
    prefix: ["/d", "/s", "/c", command, ...prefix],
  };
}

function parseVersion(version) {
  const [major = 0, minor = 0] = version.replace(/^v/, "").split(".").map(Number);
  return { major, minor };
}

function assertPrerequisites() {
  const { major } = parseVersion(process.version);
  if (major < 24) {
    throw new Error(`Node.js 24 ou superior é necessário (encontrado ${process.version}).`);
  }
  success(`Node.js ${process.version.replace(/^v/, "")} detectado.`);
}

function discoverNodeModules() {
  const priority = [
    "@iron-ledger/shared-types",
    "@iron-ledger/event-bus",
    "@iron-ledger/logger",
    "@iron-ledger/api",
    "@iron-ledger/temporal-worker",
    "@iron-ledger/web",
  ];
  const modules = [];

  for (const group of ["packages", "apps"]) {
    const groupDir = path.join(rootDir, group);
    if (!existsSync(groupDir)) continue;
    for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
      const manifestPath = path.join(groupDir, entry.name, "package.json");
      if (!entry.isDirectory() || !existsSync(manifestPath)) continue;
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      modules.push({
        name: manifest.name || `${group}/${entry.name}`,
        label: (manifest.name || entry.name).replace(/^@iron-ledger\//, ""),
      });
    }
  }

  return modules.sort((left, right) => {
    const leftPriority = priority.indexOf(left.name);
    const rightPriority = priority.indexOf(right.name);
    return (
      (leftPriority < 0 ? Number.MAX_SAFE_INTEGER : leftPriority) -
        (rightPriority < 0 ? Number.MAX_SAFE_INTEGER : rightPriority) ||
      left.name.localeCompare(right.name)
    );
  });
}

function discoverPythonServices() {
  const servicesDir = path.join(rootDir, "services");
  if (!existsSync(servicesDir)) return [];
  return readdirSync(servicesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ name: entry.name, directory: path.join(servicesDir, entry.name) }))
    .filter((service) => existsSync(path.join(service.directory, "requirements.txt")))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function needsNodeModulesRebuild() {
  const modulesConfig = path.join(rootDir, "node_modules", ".modules.yaml");
  if (!existsSync(modulesConfig)) return false;
  const match = readFileSync(modulesConfig, "utf8").match(/^virtualStoreDir:\s*(.+)$/m);
  if (!match) return false;
  const configuredDir = path.resolve(match[1].trim());
  const expectedDir = path.join(rootDir, "node_modules", ".pnpm");
  return process.platform === "win32"
    ? configuredDir.toLowerCase() !== expectedDir.toLowerCase()
    : configuredDir !== expectedDir;
}

function resolvePnpm() {
  const pnpm = systemCommand("pnpm");
  if (commandWorks(pnpm.command, [...pnpm.prefix, "--version"]))
    return { ...pnpm, label: "pnpm instalado" };

  const corepack = systemCommand("corepack", ["pnpm"]);
  if (commandWorks(corepack.command, [...corepack.prefix, "--version"]))
    return { ...corepack, label: "pnpm via Corepack" };

  const npm = systemCommand("npm");
  if (!commandWorks(npm.command, [...npm.prefix, "--version"])) {
    throw new Error("pnpm/Corepack não encontrados e npm não está disponível para o bootstrap.");
  }
  return { ...systemCommand("npx", ["--yes", "pnpm@12.6.0"]), label: "pnpm 12.6.0 via npx" };
}

function resolvePython() {
  const candidates =
    process.platform === "win32"
      ? [
          { command: "python", prefix: [] },
          { command: "py", prefix: ["-3"] },
        ]
      : [
          { command: "python3", prefix: [] },
          { command: "python", prefix: [] },
        ];

  for (const candidate of candidates) {
    const result = run(candidate.command, [...candidate.prefix, "--version"], { capture: true });
    if (result.status !== 0) continue;
    const version = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().replace(/^Python\s+/, "");
    const { major, minor } = parseVersion(version);
    if (major > 3 || (major === 3 && minor >= 11)) return { ...candidate, version };
  }
  return null;
}

function venvPythonPath(serviceDir) {
  const venvDir = path.join(serviceDir, ".venv");
  return process.platform === "win32"
    ? path.join(venvDir, "Scripts", "python.exe")
    : path.join(venvDir, "bin", "python");
}

// ---- cache (skips reinstalling when nothing changed since the last run) ----

function loadCache() {
  if (!existsSync(cachePath)) return { python: {} };
  try {
    const parsed = JSON.parse(readFileSync(cachePath, "utf8"));
    parsed.python ??= {};
    return parsed;
  } catch {
    return { python: {} };
  }
}
function saveCache(cache) {
  try {
    writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch {
    // cache is a pure optimization; failing to write it is never fatal
  }
}
function hashFile(filePath) {
  return existsSync(filePath)
    ? createHash("sha256").update(readFileSync(filePath)).digest("hex")
    : null;
}

async function confirm(question, defaultValue = true) {
  if (!process.stdin.isTTY)
    throw new Error("Execução não interativa: use --all, --node, --python ou --yes.");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const hint = defaultValue ? "S/n" : "s/N";
  const answer = (await rl.question(`${question} [${hint}] `)).trim().toLowerCase();
  rl.close();
  if (!answer) return defaultValue;
  return answer === "s" || answer === "sim" || answer === "y" || answer === "yes";
}

async function promptPlan() {
  console.log(`\nO que você quer preparar?`);
  console.log(`  ${colors.bold}1${colors.reset}) Tudo (Node.js + Python) — roda em paralelo`);
  console.log(`  ${colors.bold}2${colors.reset}) Apenas o workspace Node.js`);
  console.log(`  ${colors.bold}3${colors.reset}) Apenas os serviços Python`);
  if (!process.stdin.isTTY)
    throw new Error("Execução não interativa: use --all, --node, --python ou --yes.");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question("Escolha [1]: ")).trim();
  rl.close();
  if (answer === "2") return { node: true, python: false };
  if (answer === "3") return { node: false, python: true };
  return { node: true, python: true };
}

// ---- install phases ----

function ensureEnvFile() {
  const envPath = path.join(rootDir, ".env");
  const examplePath = path.join(rootDir, ".env.example");
  if (existsSync(envPath) || !existsSync(examplePath)) return;
  copyFileSync(examplePath, envPath);
  success(".env criado a partir de .env.example.");
}

async function installNodeWorkspace(cache) {
  const start = performance.now();
  const modules = discoverNodeModules();
  info(`[node] Módulos: ${modules.map((m) => m.label).join(", ") || "(nenhum encontrado)"}`);

  const lockPath = path.join(rootDir, "pnpm-lock.yaml");
  const currentHash = hashFile(lockPath);
  const rebuildNeeded = needsNodeModulesRebuild();
  const upToDate =
    !forceReinstall &&
    !rebuildNeeded &&
    currentHash &&
    cache.node === currentHash &&
    existsSync(path.join(rootDir, "node_modules"));

  if (upToDate) {
    success("[node] Workspace já atualizado (lockfile sem mudanças); instalação pulada.");
    await generatePrismaClient();
    return { skipped: true, durationMs: performance.now() - start };
  }

  const pnpm = resolvePnpm();
  const installArgs = [...pnpm.prefix, "install"];
  if (rebuildNeeded) {
    info("[node] O node_modules pertence a outro caminho; reconstruindo os links locais...");
    installArgs.push("--force");
  }
  info(`[node] Instalando dependências com ${pnpm.label}...`);
  await spawnAsync(pnpm.command, installArgs, { tag: "node", color: colors.cyan });

  if (currentHash) cache.node = currentHash;
  success(`[node] ${modules.length} módulo(s) instalado(s).`);
  await generatePrismaClient();
  return { skipped: false, durationMs: performance.now() - start };
}

async function generatePrismaClient() {
  info("[node] Gerando o Prisma Client da API...");
  await spawnAsync(
    process.execPath,
    [path.join(rootDir, "scripts", "run-prisma.mjs"), "generate"],
    {
      tag: "node",
      color: colors.cyan,
    },
  );
}

/** Passos extras por serviço Python, executados depois das dependências. */
const pythonServiceSetup = {
  // Sem os CSVs da Olist e o banco derivado, a API do analytics sobe vazia.
  async analytics(service, venvPython, tag, color) {
    const database = path.join(service.directory, "data", "processed", "analytics.db");
    if (existsSync(database) && !forceReinstall) {
      success(`[${tag}] Base analítica já gerada; pipeline pulado.`);
      return;
    }
    try {
      info(`[${tag}] Baixando os CSVs da Olist...`);
      await spawnAsync(venvPython, ["-m", "src.cli", "download"], {
        cwd: service.directory,
        tag,
        color,
      });
      info(`[${tag}] Executando o pipeline analítico (pode levar alguns minutos)...`);
      await spawnAsync(venvPython, ["-m", "src.cli", "run"], {
        cwd: service.directory,
        tag,
        color,
      });
      success(`[${tag}] Base analítica gerada.`);
    } catch (error) {
      // Sem dados a API ainda sobe; não bloqueia o restante do setup.
      warn(`[${tag}] Dados da Olist não preparados: ${error.message}`);
    }
  },
};

async function installOnePythonService(service, python, cache, color) {
  const tag = `python:${service.name}`;
  const venvPython = venvPythonPath(service.directory);
  const reqPath = path.join(service.directory, "requirements.txt");
  const currentHash = hashFile(reqPath);

  const upToDate =
    !forceReinstall && existsSync(venvPython) && cache.python[service.name] === currentHash;
  if (upToDate) {
    success(`[${tag}] Já atualizado (requirements.txt sem mudanças); instalação pulada.`);
    await pythonServiceSetup[service.name]?.(service, venvPython, tag, color);
    return;
  }

  if (!existsSync(venvPython)) {
    info(`[${tag}] Criando ambiente virtual...`);
    await spawnAsync(python.command, [...python.prefix, "-m", "venv", ".venv"], {
      cwd: service.directory,
      tag,
      color,
    });
  }

  info(`[${tag}] Instalando dependências...`);
  await spawnAsync(
    venvPython,
    ["-m", "pip", "install", "-r", "requirements.txt", "--disable-pip-version-check"],
    {
      cwd: service.directory,
      tag,
      color,
    },
  );

  cache.python[service.name] = currentHash;
  success(`[${tag}] Módulo instalado.`);
  await pythonServiceSetup[service.name]?.(service, venvPython, tag, color);
}

async function installPythonServices(cache) {
  const start = performance.now();
  const services = discoverPythonServices();
  if (services.length === 0) {
    info("[python] Nenhum serviço com requirements.txt foi encontrado.");
    return { skipped: true, durationMs: 0 };
  }

  const python = resolvePython();
  if (!python) throw new Error("Python 3.11 ou superior não foi encontrado.");
  success(`[python] Python ${python.version} detectado.`);

  const palette = [colors.magenta, colors.yellow, colors.blue];
  const results = await Promise.allSettled(
    services.map((service, index) =>
      installOnePythonService(service, python, cache, palette[index % palette.length]),
    ),
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) throw new Error(failures.map((f) => f.reason.message).join("\n"));

  return { skipped: false, durationMs: performance.now() - start };
}

// ---- reporting ----

function printSummary(phases, totalMs) {
  console.log(`\n${colors.bold}Resumo${colors.reset}`);
  for (const phase of phases) {
    const time = phase.durationMs != null ? `${(phase.durationMs / 1000).toFixed(1)}s` : "—";
    if (phase.ok)
      success(`${phase.label} — ${phase.skipped ? "sem mudanças" : "concluído"} (${time})`);
    else fail(`${phase.label} — falhou: ${phase.error.message}`);
  }
  console.log(`${colors.gray}Tempo total: ${(totalMs / 1000).toFixed(1)}s${colors.reset}`);
}

function printNextSteps() {
  console.log(`\nPróximos passos:`);
  console.log(`  • pnpm infra:core          PostgreSQL, RabbitMQ e Redis`);
  console.log(`  • pnpm infra:platform      Temporal (necessário para o worker)`);
  console.log(`  • pnpm db:deploy && pnpm db:seed`);
  console.log(`  • pnpm dev                 API, Web, Worker e Analytics`);
}

async function main() {
  if (showHelp) return printHelp();
  if (onlyNode && onlyPython) throw new Error("Use somente uma opção: --node ou --python.");

  banner("Iron Ledger · Preparação modular do ambiente");
  assertPrerequisites();

  const plan = onlyNode
    ? { node: true, python: false }
    : onlyPython
      ? { node: false, python: true }
      : assumeYes
        ? { node: true, python: true }
        : await promptPlan();

  const tasks = [];
  if (plan.node) tasks.push(["Workspace Node.js", installNodeWorkspace]);
  if (plan.python) tasks.push(["Serviços Python", installPythonServices]);
  if (tasks.length === 0) return info("Nada selecionado para instalar.");

  ensureEnvFile();
  const cache = loadCache();
  const totalStart = performance.now();
  console.log(
    `\n${colors.bold}Executando${tasks.length === 2 ? " em paralelo" : ""}...${colors.reset}`,
  );

  const settled = await Promise.allSettled(tasks.map(([, fn]) => fn(cache)));
  const phases = settled.map((result, index) => {
    const [label] = tasks[index];
    return result.status === "fulfilled"
      ? { label, ok: true, ...result.value }
      : { label, ok: false, error: result.reason, durationMs: null };
  });

  saveCache(cache);
  printSummary(phases, performance.now() - totalStart);

  if (phases.some((p) => !p.ok)) {
    process.exitCode = 1;
  } else {
    console.log(`\n${colors.green}${colors.bold}Ambiente preparado com sucesso.${colors.reset}`);
    printNextSteps();
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
