import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { reachable } from "../lib/net.mjs";
import { bold, gray, orange, teal } from "../lib/terminal.mjs";
import { panel, symbols } from "../lib/ui.mjs";

function listeners(port) {
  try {
    const output = execFileSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
      encoding: "utf8",
    });
    return [
      ...new Set(
        output
          .trim()
          .split(/\s+/)
          .map(Number)
          .filter((pid) => pid > 0),
      ),
    ];
  } catch {
    return [];
  }
}

function processName(pid) {
  try {
    return (
      execFileSync("ps", ["-p", String(pid), "-o", "args="], { encoding: "utf8" }).trim() ||
      "processo desconhecido"
    );
  } catch {
    return "processo desconhecido";
  }
}

export async function resolveOccupiedPorts(
  requested,
  environments,
  { input = process.stdin, output = process.stdout } = {},
) {
  const ports = new Map();
  for (const name of requested) {
    const port = Number(
      name === "analytics" ? (environments[name].ANALYTICS_PORT ?? 8000) : environments[name].PORT,
    );
    if (["api", "web", "analytics"].includes(name) && Number.isInteger(port) && port > 0) {
      const services = ports.get(port) ?? [];
      services.push(name);
      ports.set(port, services);
    }
  }

  for (const [port, names] of ports) {
    if (!(await reachable({ host: "127.0.0.1", port }))) continue;
    const pids = listeners(port);
    const label = names.join(", ");
    if (!pids.length) {
      output.write(
        `${panel({
          tone: "warn",
          title: `Porta ${port} em uso`,
          body: [
            `${bold(label)} precisa da porta ${port}, mas outro processo a ocupa.`,
            "Não foi possível identificar qual (talvez de outro usuário ou container).",
            "",
            gray("Libere a porta ou altere-a no .env."),
          ],
        })}\n`,
      );
      continue;
    }
    output.write(
      `${panel({
        tone: "warn",
        title: `Porta ${port} em uso`,
        body: [
          `${bold(label)} precisa da porta ${port}, mas ela está ocupada:`,
          "",
          ...pids.map((pid) => `${gray(`PID ${pid}`)}  ${teal(processName(pid).slice(0, 52))}`),
        ],
      })}\n`,
    );
    if (!input.isTTY || !output.isTTY) {
      output.write(`  ${gray("Terminal não interativo; processo mantido.")}\n\n`);
      continue;
    }
    const rl = createInterface({ input, output });
    let answer;
    try {
      answer = await rl.question(
        `  ${symbols.step}  Encerrar ${pids.length > 1 ? "esses processos" : "esse processo"} para liberar a porta? ${gray("[s/N]")} `,
      );
    } finally {
      rl.close();
    }
    if (!/^(y|yes|s|sim)$/i.test(answer.trim())) continue;
    for (const pid of pids) {
      try {
        process.kill(pid, "SIGTERM");
      } catch (error) {
        output.write(`  ${symbols.fail}  Não foi possível encerrar PID ${pid}: ${error.message}\n`);
      }
    }
    for (let attempt = 0; attempt < 20; attempt++) {
      if (!(await reachable({ host: "127.0.0.1", port }))) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (await reachable({ host: "127.0.0.1", port })) {
      output.write(
        `  ${symbols.warn}  ${orange(`Porta ${port} ainda ocupada.`)} ${gray("Encerre o processo supervisor ou altere a porta no .env.")}\n\n`,
      );
    } else {
      output.write(`  ${symbols.ok}  Porta ${port} liberada\n\n`);
    }
  }
}
