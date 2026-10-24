import { copyFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import path from "node:path";
import process from "node:process";
import { bold, banner, fail, gray, green, info, success } from "../lib/terminal.mjs";
import { rootDir } from "../lib/workspace.cjs";
import { loadCache, saveCache } from "./cache.mjs";
import { installNodeWorkspace } from "./node.mjs";
import { installPythonServices } from "./python.mjs";

const flags = new Set(process.argv.slice(2));
const options = {
  onlyNode: flags.has("--node"),
  onlyPython: flags.has("--python"),
  assumeYes: ["--all", "--yes", "-y"].some((flag) => flags.has(flag)),
  force: flags.has("--force"),
  help: flags.has("--help") || flags.has("-h"),
};

const NON_INTERACTIVE = "Execução não interativa: use --all, --node, --python ou --yes.";

function printHelp() {
  console.log(`
${bold("Iron Ledger · Preparação do ambiente")}

Uso:
  node scripts/setup/bootstrap.mjs [opções]

Opções:
  --all       Instala tudo sem perguntar (Node.js + Python)
  --node      Instala apenas o workspace Node.js
  --python    Prepara apenas os serviços Python
  --yes, -y   Não pergunta nada (equivalente a --all quando sozinho)
  --force     Ignora o cache e reinstala mesmo sem mudanças
  --help, -h  Mostra esta ajuda
`);
}

async function ask(question) {
  if (!process.stdin.isTTY) throw new Error(NON_INTERACTIVE);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function promptPlan() {
  console.log(`\nO que você quer preparar?`);
  console.log(`  ${bold("1")}) Tudo (Node.js + Python) — roda em paralelo`);
  console.log(`  ${bold("2")}) Apenas o workspace Node.js`);
  console.log(`  ${bold("3")}) Apenas os serviços Python`);
  const answer = await ask("Escolha [1]: ");
  if (answer === "2") return { node: true, python: false };
  if (answer === "3") return { node: false, python: true };
  return { node: true, python: true };
}

function choosePlan() {
  if (options.onlyNode) return { node: true, python: false };
  if (options.onlyPython) return { node: false, python: true };
  if (options.assumeYes) return { node: true, python: true };
  return promptPlan();
}

function assertPrerequisites() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 24) {
    throw new Error(`Node.js 24 ou superior é necessário (encontrado ${process.version}).`);
  }
  success(`Node.js ${process.versions.node} detectado.`);
}

function ensureEnvFile() {
  const envPath = path.join(rootDir, ".env");
  const examplePath = path.join(rootDir, ".env.example");
  if (existsSync(envPath) || !existsSync(examplePath)) return;
  copyFileSync(examplePath, envPath);
  success(".env criado a partir de .env.example.");
}

function printSummary(phases, totalMs) {
  console.log(`\n${bold("Resumo")}`);
  for (const phase of phases) {
    const time = phase.durationMs != null ? `${(phase.durationMs / 1000).toFixed(1)}s` : "—";
    if (phase.ok)
      success(`${phase.label} — ${phase.skipped ? "sem mudanças" : "concluído"} (${time})`);
    else fail(`${phase.label} — falhou: ${phase.error.message}`);
  }
  console.log(gray(`Tempo total: ${(totalMs / 1000).toFixed(1)}s`));
}

function printNextSteps() {
  console.log(`\nPróximos passos:`);
  console.log(`  • pnpm infra:core          PostgreSQL, RabbitMQ e Redis`);
  console.log(`  • pnpm infra:platform      Temporal (necessário para o worker)`);
  console.log(`  • pnpm db:deploy && pnpm db:seed`);
  console.log(`  • pnpm dev                 API, Web, Worker e Analytics`);
}

async function main() {
  if (options.help) return printHelp();
  if (options.onlyNode && options.onlyPython) {
    throw new Error("Use somente uma opção: --node ou --python.");
  }

  banner("Iron Ledger · Preparação modular do ambiente");
  assertPrerequisites();

  const plan = await choosePlan();
  const tasks = [];
  if (plan.node) tasks.push(["Workspace Node.js", installNodeWorkspace]);
  if (plan.python) tasks.push(["Serviços Python", installPythonServices]);
  if (tasks.length === 0) return info("Nada selecionado para instalar.");

  ensureEnvFile();
  const cache = loadCache();
  const totalStart = performance.now();
  console.log(`\n${bold(`Executando${tasks.length === 2 ? " em paralelo" : ""}...`)}`);

  const settled = await Promise.allSettled(tasks.map(([, install]) => install(cache, options)));
  const phases = settled.map((result, index) => {
    const [label] = tasks[index];
    return result.status === "fulfilled"
      ? { label, ok: true, ...result.value }
      : { label, ok: false, error: result.reason, durationMs: null };
  });

  saveCache(cache);
  printSummary(phases, performance.now() - totalStart);

  if (phases.some((phase) => !phase.ok)) {
    process.exitCode = 1;
  } else {
    console.log(`\n${green(bold("Ambiente preparado com sucesso."))}`);
    printNextSteps();
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
