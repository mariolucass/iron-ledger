import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { loadWorkspaceEnv } from "./app-env.cjs";

const apiDir = fileURLToPath(new URL("../apps/api/", import.meta.url));
const require = createRequire(new URL("../apps/api/package.json", import.meta.url));
const child = spawn(
  process.execPath,
  [require.resolve("prisma/build/index.js"), ...process.argv.slice(2)],
  {
    cwd: apiDir,
    env: loadWorkspaceEnv("api"),
    stdio: "inherit",
  },
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
});
