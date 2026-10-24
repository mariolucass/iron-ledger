const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");
const { apps, rootDir: defaultRootDir } = require("./workspace.cjs");

function loadAppEnv(rootEnv, appEnv, inheritedEnv = process.env) {
  const readEnv = (file) => (file && existsSync(file) ? parseEnv(readFileSync(file, "utf8")) : {});
  return { ...readEnv(rootEnv), ...readEnv(appEnv), ...inheritedEnv };
}

function loadWorkspaceEnv(app, inheritedEnv = process.env, rootDir = defaultRootDir) {
  if (!Object.hasOwn(apps, app)) throw new Error(`Aplicação desconhecida: ${app}`);
  const env = loadAppEnv(
    path.join(rootDir, ".env"),
    path.join(rootDir, apps[app].dir, ".env"),
    inheritedEnv,
  );

  // PORT is reserved for an explicit runtime override (including containers).
  if (app === "api") env.PORT ??= env.API_PORT ?? "3000";
  if (app === "web") {
    env.PORT ??= env.WEB_PORT ?? "3001";
    env.API_URL ??= `http://localhost:${env.API_PORT ?? "3000"}`;
    env.NEXT_PUBLIC_APP_URL ??= env.WEB_URL ?? `http://localhost:${env.PORT}`;
  }
  if (app === "worker") env.API_URL ??= `http://localhost:${env.API_PORT ?? "3000"}`;
  return env;
}

module.exports = { loadAppEnv, loadWorkspaceEnv };
