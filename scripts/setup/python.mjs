import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { isWindows, runSync, spawnTagged } from "../lib/process.mjs";
import { blue, info, magenta, success, warn, yellow } from "../lib/terminal.mjs";
import { analyticsDatabase, rootDir, venvPython } from "../lib/workspace.cjs";
import { hashFile } from "./cache.mjs";

const palette = [magenta, yellow, blue];

export function parseVersion(version) {
  const [major = 0, minor = 0] = version.replace(/^v/, "").split(".").map(Number);
  return { major, minor };
}

function discoverServices() {
  const servicesDir = path.join(rootDir, "services");
  if (!existsSync(servicesDir)) return [];
  return readdirSync(servicesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ name: entry.name, directory: path.join(servicesDir, entry.name) }))
    .filter((service) => existsSync(path.join(service.directory, "requirements.txt")))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Primeiro interpretador Python >= 3.11 disponível no sistema. */
function resolvePython() {
  const candidates = isWindows
    ? [
        { command: "python", prefix: [] },
        { command: "py", prefix: ["-3"] },
      ]
    : [
        { command: "python3", prefix: [] },
        { command: "python", prefix: [] },
      ];

  for (const candidate of candidates) {
    const result = runSync(candidate.command, [...candidate.prefix, "--version"], {
      capture: true,
    });
    if (result.status !== 0) continue;
    const version = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().replace(/^Python\s+/, "");
    const { major, minor } = parseVersion(version);
    if (major > 3 || (major === 3 && minor >= 11)) return { ...candidate, version };
  }
  return null;
}

/** Passos extras por serviço, executados depois das dependências. */
const serviceSetup = {
  // Sem os CSVs da Olist e o banco derivado, a API do analytics sobe vazia.
  async analytics({ directory, tag, paint, force }) {
    if (existsSync(analyticsDatabase) && !force) {
      success(`[${tag}] Base analítica já gerada; pipeline pulado.`);
      return;
    }
    const cli = (command) =>
      spawnTagged(venvPython(directory), ["-m", "src.cli", command], {
        cwd: directory,
        tag,
        paint,
      });
    try {
      info(`[${tag}] Baixando os CSVs da Olist...`);
      await cli("download");
      info(`[${tag}] Executando o pipeline analítico (pode levar alguns minutos)...`);
      await cli("run");
      success(`[${tag}] Base analítica gerada.`);
    } catch (error) {
      // Sem dados a API ainda sobe; não bloqueia o restante do setup.
      warn(`[${tag}] Dados da Olist não preparados: ${error.message}`);
    }
  },
};

async function installService(service, python, cache, paint, { force }) {
  const tag = `python:${service.name}`;
  const venv = venvPython(service.directory);
  const requirementsHash = hashFile(path.join(service.directory, "requirements.txt"));
  const inService = (command, args) =>
    spawnTagged(command, args, { cwd: service.directory, tag, paint });

  const upToDate = !force && existsSync(venv) && cache.python[service.name] === requirementsHash;
  if (upToDate) {
    success(`[${tag}] Já atualizado (requirements.txt sem mudanças); instalação pulada.`);
  } else {
    if (!existsSync(venv)) {
      info(`[${tag}] Criando ambiente virtual...`);
      await inService(python.command, [...python.prefix, "-m", "venv", ".venv"]);
    }
    info(`[${tag}] Instalando dependências...`);
    await inService(venv, [
      "-m",
      "pip",
      "install",
      "-r",
      "requirements.txt",
      "--disable-pip-version-check",
    ]);
    cache.python[service.name] = requirementsHash;
    success(`[${tag}] Módulo instalado.`);
  }

  await serviceSetup[service.name]?.({ ...service, tag, paint, force });
}

export async function installPythonServices(cache, { force }) {
  const start = performance.now();
  const services = discoverServices();
  if (services.length === 0) {
    info("[python] Nenhum serviço com requirements.txt foi encontrado.");
    return { skipped: true, durationMs: 0 };
  }

  const python = resolvePython();
  if (!python) throw new Error("Python 3.11 ou superior não foi encontrado.");
  success(`[python] Python ${python.version} detectado.`);

  const results = await Promise.allSettled(
    services.map((service, index) =>
      installService(service, python, cache, palette[index % palette.length], { force }),
    ),
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) throw new Error(failures.map((f) => f.reason.message).join("\n"));

  return { skipped: false, durationMs: performance.now() - start };
}
