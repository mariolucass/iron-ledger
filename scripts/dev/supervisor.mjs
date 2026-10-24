import { spawn } from "node:child_process";
import { isWindows, signalTree } from "../lib/process.mjs";
import { rootDir } from "../lib/workspace.cjs";

/**
 * Inicia os serviços e os mantém sob um único ciclo de vida: Ctrl+C/SIGTERM encerra a árvore
 * inteira. Com `isolateFailures`, a queda de um serviço não derruba os demais.
 * Resolve com o maior código de saída não nulo.
 */
export async function supervise(entries, { isolateFailures }) {
  const children = entries.map(({ name, launch, env }) => {
    const child = spawn(launch.command, launch.args, {
      cwd: launch.cwd ?? rootDir,
      env,
      shell: launch.shell,
      stdio: "inherit",
      detached: !isWindows,
    });
    return { name, child };
  });

  let exitCode = 0;
  let shuttingDown = false;

  function stopAll() {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const { child } of children) signalTree(child, "SIGTERM");
    // Um processo que ignora SIGTERM não deve manter a porta ocupada.
    if (!isWindows) {
      setTimeout(() => {
        for (const { child } of children) signalTree(child, "SIGKILL");
      }, 5000);
    }
  }

  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, stopAll);

  await Promise.all(
    children.map(
      ({ name, child }) =>
        new Promise((resolve) => {
          child.on("error", (error) => {
            console.error(error);
            exitCode = 1;
            stopAll();
            resolve();
          });
          child.on("exit", (code, signal) => {
            if (code && code !== 0) exitCode = code;
            if (!shuttingDown && isolateFailures && children.length > 1) {
              console.error(
                `\n[dev] ${name} encerrou (código ${code ?? signal}); demais serviços seguem ativos.\n`,
              );
            } else if (!shuttingDown) {
              stopAll();
            }
            resolve();
          });
        }),
    ),
  );

  return exitCode;
}
