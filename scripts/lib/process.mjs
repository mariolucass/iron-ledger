import { spawn, spawnSync } from "node:child_process";
import { gray } from "./terminal.mjs";
import { rootDir } from "./workspace.cjs";

export const isWindows = process.platform === "win32";

const quote = (arg) => (/[^\w@./:=-]/.test(arg) ? JSON.stringify(arg) : arg);

/** No Windows o pnpm é um .cmd e exige shell; nos demais sistemas o spawn é direto. */
export function pnpmInvocation(args) {
  return isWindows
    ? { command: ["pnpm", ...args.map(quote)].join(" "), args: [], shell: true }
    : { command: "pnpm", args, shell: false };
}

/** Execução síncrona; com `capture` devolve stdout/stderr em vez de herdar o terminal. */
export function runSync(command, args, { cwd = rootDir, capture = false, shell = false } = {}) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell,
    stdio: capture ? "pipe" : "inherit",
  });
}

export function runPnpmSync(args, options) {
  const { command, args: pnpmArgs, shell } = pnpmInvocation(args);
  return runSync(command, pnpmArgs, { ...options, shell });
}

/** Spawn assíncrono com saída prefixada por linha — seguro para rodar em paralelo. */
export function spawnTagged(command, args, { cwd = rootDir, tag, paint = gray } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: false });
    const prefix = tag ? `${paint(`[${tag}]`)} ` : "";

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
      else reject(new Error(`${command} ${args.join(" ")} saiu com código ${code}`));
    });
  });
}

/** Sinaliza o processo e seus descendentes (pnpm inicia Next, tsx etc. em outros processos). */
export function signalTree(child, signal) {
  if (!child.pid) return;
  if (isWindows) {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }
  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") console.error(error);
  }
}
