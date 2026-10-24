const path = require("node:path");

const rootDir = path.resolve(__dirname, "..", "..");

/**
 * Fonte única dos serviços do monorepo.
 * `filter` existe apenas para pacotes do workspace pnpm; `analytics` é Python e roda pelo .venv.
 */
const apps = {
  api: { dir: "apps/api", filter: "@iron-ledger/api" },
  web: { dir: "apps/web", filter: "@iron-ledger/web" },
  worker: { dir: "apps/temporal-worker", filter: "@iron-ledger/temporal-worker" },
  analytics: { dir: "services/analytics" },
};

function venvPython(serviceDir) {
  return path.join(
    serviceDir,
    ".venv",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
  );
}

const analyticsDir = path.join(rootDir, apps.analytics.dir);
const analyticsDatabase = path.join(analyticsDir, "data", "processed", "analytics.db");

module.exports = { rootDir, apps, venvPython, analyticsDir, analyticsDatabase };
