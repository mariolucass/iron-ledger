import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { isWindows, runSync, spawnTagged } from "../lib/process.mjs";
import { cyan, info, success } from "../lib/terminal.mjs";
import { rootDir } from "../lib/workspace.cjs";
import { hashFile } from "./cache.mjs";

const tag = "node";

// Ordem de exibição: pacotes compartilhados primeiro, depois as aplicações.
const priority = [
  "@iron-ledger/shared-types",
  "@iron-ledger/event-bus",
  "@iron-ledger/logger",
  "@iron-ledger/api",
  "@iron-ledger/temporal-worker",
  "@iron-ledger/web",
];

function discoverModules() {
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

  const rank = (name) => {
    const index = priority.indexOf(name);
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  };
  return modules.sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
}

/** Um node_modules copiado de outro caminho aponta o virtual store para fora deste repositório. */
function needsNodeModulesRebuild() {
  const modulesConfig = path.join(rootDir, "node_modules", ".modules.yaml");
  if (!existsSync(modulesConfig)) return false;
  const match = readFileSync(modulesConfig, "utf8").match(/^virtualStoreDir:\s*(.+)$/m);
  if (!match) return false;
  const configuredDir = path.resolve(match[1].trim());
  const expectedDir = path.join(rootDir, "node_modules", ".pnpm");
  return isWindows
    ? configuredDir.toLowerCase() !== expectedDir.toLowerCase()
    : configuredDir !== expectedDir;
}

function systemCommand(command, prefix = []) {
  if (!isWindows) return { command, prefix };
  return {
    command: process.env.ComSpec || "cmd.exe",
    prefix: ["/d", "/s", "/c", command, ...prefix],
  };
}

const works = ({ command, prefix }) =>
  runSync(command, [...prefix, "--version"], { capture: true }).status === 0;

/** pnpm instalado, senão via Corepack, senão via npx (último recurso). */
function resolvePnpm() {
  const pnpm = systemCommand("pnpm");
  if (works(pnpm)) return { ...pnpm, label: "pnpm instalado" };

  const corepack = systemCommand("corepack", ["pnpm"]);
  if (works(corepack)) return { ...corepack, label: "pnpm via Corepack" };

  if (!works(systemCommand("npm"))) {
    throw new Error("pnpm/Corepack não encontrados e npm não está disponível para o bootstrap.");
  }
  return { ...systemCommand("npx", ["--yes", "pnpm@12.6.0"]), label: "pnpm 12.6.0 via npx" };
}

async function generatePrismaClient() {
  info(`[${tag}] Gerando o Prisma Client da API...`);
  await spawnTagged(
    process.execPath,
    [path.join(rootDir, "scripts", "db", "run-prisma.mjs"), "generate"],
    { tag, paint: cyan },
  );
}

export async function installNodeWorkspace(cache, { force }) {
  const start = performance.now();
  const modules = discoverModules();
  info(`[${tag}] Módulos: ${modules.map((m) => m.label).join(", ") || "(nenhum encontrado)"}`);

  const lockHash = hashFile(path.join(rootDir, "pnpm-lock.yaml"));
  const rebuildNeeded = needsNodeModulesRebuild();
  const upToDate =
    !force &&
    !rebuildNeeded &&
    lockHash &&
    cache.node === lockHash &&
    existsSync(path.join(rootDir, "node_modules"));

  if (upToDate) {
    success(`[${tag}] Workspace já atualizado (lockfile sem mudanças); instalação pulada.`);
    await generatePrismaClient();
    return { skipped: true, durationMs: performance.now() - start };
  }

  const pnpm = resolvePnpm();
  const installArgs = [...pnpm.prefix, "install"];
  if (rebuildNeeded) {
    info(`[${tag}] O node_modules pertence a outro caminho; reconstruindo os links locais...`);
    installArgs.push("--force");
  }
  info(`[${tag}] Instalando dependências com ${pnpm.label}...`);
  await spawnTagged(pnpm.command, installArgs, { tag, paint: cyan });

  if (lockHash) cache.node = lockHash;
  success(`[${tag}] ${modules.length} módulo(s) instalado(s).`);
  await generatePrismaClient();
  return { skipped: false, durationMs: performance.now() - start };
}
