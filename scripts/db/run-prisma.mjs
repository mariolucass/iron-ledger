import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { loadWorkspaceEnv } from "../lib/app-env.cjs";
import { apps, rootDir } from "../lib/workspace.cjs";
import path from "node:path";

const apiDir = path.join(rootDir, apps.api.dir);
const require = createRequire(path.join(apiDir, "package.json"));
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
