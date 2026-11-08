import { spawn } from "node:child_process";
import { isWindows, signalTree } from "../lib/process.mjs";
import { bold, gray, green, orange, red, subtle } from "../lib/terminal.mjs";
import { parseStructuredLog } from "./log-format.mjs";
import { serviceColor } from "./services.mjs";
import { formatDuration, rule, symbols } from "../lib/ui.mjs";
import { rootDir } from "../lib/workspace.cjs";

const GRACE_MS = 10_000;

/** Com a saída em pipe as ferramentas desligam as cores e o Python guarda o buffer; restaura os dois. */
const colorEnv = (env) => ({
  ...env,
  PYTHONUNBUFFERED: "1",
  ...(process.stdout.isTTY && !process.env.NO_COLOR ? { FORCE_COLOR: "1" } : {}),
});

/** Encerra os processos filhos com SIGTERM, aguarda e só então força SIGKILL. */
export async function supervise(entries, { isolateFailures }) {
  const startedAt = Date.now();
  const children = entries.map(({ name, launch, env }) => ({
    name,
    done: false,
    forced: false,
    child: spawn(launch.command, launch.args, {
      cwd: launch.cwd ?? rootDir,
      env: colorEnv(env),
      shell: launch.shell,
      stdio: ["inherit", "pipe", "pipe"],
      detached: !isWindows,
    }),
  }));
  const tagWidth = Math.max(...children.map(({ name }) => name.length));
  const hinted = new Set();

  /** Imprime a saída do serviço linha a linha, com a origem à esquerda. */
  function pipeTagged({ name, child }, stream, target) {
    const tag = `${serviceColor(name)(name.padEnd(tagWidth))} ${subtle("│")} `;
    let buffer = "";
    const emit = (raw) => {
      const line = raw.replace(/\r$/, "");
      if (!line.replace(/\u001b\[[0-9;?]*[A-Za-z]/g, "").trim()) return;
      const log = parseStructuredLog(line);
      target.write(`${tag}${log ? log.text : line}\n`);
      if (log?.detail) target.write(`${tag}${log.detail}\n`);
      if (log?.level === "fatal" && !hinted.has(name)) {
        hinted.add(name);
        target.write(`${tag}${orange("▲")} ${gray("falha fatal: o processo segue em modo watch; corrija a causa e salve um arquivo (ou reinicie) para tentar de novo")}\n`);
      }
    };
    stream.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();
      lines.forEach(emit);
    });
    stream.on("end", () => buffer && emit(buffer));
  }
  for (const item of children) {
    pipeTagged(item, item.child.stdout, process.stdout);
    pipeTagged(item, item.child.stderr, process.stderr);
  }
  let exitCode = 0;
  let shuttingDown = false;
  let stoppedAt = 0;
  let timer;

  const names = (list) => list.map(({ name }) => bold(name)).join(gray(", "));

  function forceAll() {
    const pending = children.filter(({ done }) => !done);
    if (!pending.length) return;
    console.error(`  ${symbols.warn}  Forçando ${names(pending)} ${gray("(SIGKILL)")}`);
    for (const item of pending) {
      item.forced = true;
      signalTree(item.child, "SIGKILL");
    }
  }

  function stopAll(reason) {
    if (shuttingDown) return;
    shuttingDown = true;
    stoppedAt = Date.now();
    const running = children.filter(({ done }) => !done);
    console.log(`\n${rule()}`);
    console.log(`  ${symbols.stop}  ${bold("Encerrando")} ${gray(`· ${reason}`)}`);
    if (running.length)
      console.log(
        `  ${gray(`Aguardando ${names(running)} finalizarem (até ${GRACE_MS / 1000}s)...`)}\n`,
      );
    for (const { child } of running) signalTree(child, "SIGTERM");
    if (!isWindows && running.length) timer = setTimeout(forceAll, GRACE_MS);
  }

  const onInt = () => {
    if (shuttingDown) forceAll();
    else stopAll("Ctrl+C recebido");
  };
  const onTerm = () => stopAll("sinal de encerramento recebido");
  process.on("SIGINT", onInt);
  process.on("SIGTERM", onTerm);
  try {
    await Promise.all(
      children.map(
        ({ name, child }, index) =>
          new Promise((resolve) => {
            const finish = (code, signal, error) => {
              if (children[index].done) return;
              children[index].done = true;
              if (error)
                console.error(
                  `  ${symbols.fail}  ${bold(name)} ${red(error.message ?? String(error))}`,
                );
              const crashed = error || (code && code !== 0 && !shuttingDown);
              if (crashed) exitCode = code || 1;
              const how = signal ? `sinal ${signal}` : `código ${code}`;
              if (!shuttingDown && isolateFailures && children.length > 1) {
                console.error(
                  `\n  ${symbols.warn}  ${bold(name)} ${orange(`encerrou inesperadamente (${how})`)} ${gray("· os demais continuam")}\n`,
                );
              } else if (!shuttingDown) {
                console.error(
                  `\n  ${crashed ? symbols.fail : symbols.warn}  ${bold(name)} ${crashed ? red(`parou com ${how}`) : orange("encerrou")}`,
                );
                stopAll(`${name} encerrou`);
              } else {
                const took = formatDuration(Date.now() - stoppedAt);
                const suffix = children[index].forced ? orange("forçado") : green("encerrado");
                console.log(`  ${symbols.ok}  ${bold(name)} ${suffix} ${gray(took)}`);
              }
              resolve();
            };
            child.once("error", (error) => finish(1, null, error));
            child.once("exit", (code, signal) => finish(code, signal));
          }),
      ),
    );
  } finally {
    clearTimeout(timer);
    process.off("SIGINT", onInt);
    process.off("SIGTERM", onTerm);
  }
  if (shuttingDown) {
    console.log(
      `\n  ${green("●")} ${bold("Tudo encerrado")} ${gray(`· sessão de ${formatDuration(Date.now() - startedAt)}`)}`,
    );
    console.log(`${rule()}\n`);
  }
  return exitCode;
}
