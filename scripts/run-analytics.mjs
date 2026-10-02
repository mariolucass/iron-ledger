import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env");
if (existsSync(envFile)) loadEnvFile(envFile);
const service = path.join(root, "services", "analytics");
const python = path.join(service, ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
if (!existsSync(python)) {
  console.error("Python do analytics não encontrado. Execute npm run setup:python primeiro.");
  process.exit(1);
}
const child = spawn(python, ["main.py"], { cwd: service, env: process.env, stdio: "inherit" });
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
child.on("exit", (code) => { process.exitCode = code ?? 1; });
