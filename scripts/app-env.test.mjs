import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { loadAppEnv, loadWorkspaceEnv } from "./app-env.cjs";

function envFiles(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "iron-ledger-env-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return { root: path.join(dir, ".env"), app: path.join(dir, "api.env") };
}

test("API credentials override root defaults without changing the parent environment", (t) => {
  const { root, app } = envFiles(t);
  writeFileSync(root, "DATABASE_URL=postgresql://root/db\nAPI_PORT=3000\n");
  writeFileSync(app, "DATABASE_URL=postgresql://api/db\nJWT_SECRET=app-secret\n");
  const inherited = { PATH: "/bin" };
  assert.deepEqual(loadAppEnv(root, app, inherited), {
    DATABASE_URL: "postgresql://api/db",
    API_PORT: "3000",
    JWT_SECRET: "app-secret",
    PATH: "/bin",
  });
  assert.deepEqual(inherited, { PATH: "/bin" });
});

test("explicit shell credentials override both env files", (t) => {
  const { root, app } = envFiles(t);
  writeFileSync(root, "DATABASE_URL=postgresql://root/db\n");
  writeFileSync(app, "DATABASE_URL=postgresql://api/db\n");
  assert.equal(
    loadAppEnv(root, app, { DATABASE_URL: "postgresql://shell/db" }).DATABASE_URL,
    "postgresql://shell/db",
  );
});

test("optional env files fall back to root defaults and shell values", (t) => {
  const { root, app } = envFiles(t);
  assert.deepEqual(loadAppEnv(root, app, { PATH: "/bin" }), { PATH: "/bin" });
  writeFileSync(root, "API_PORT=3000\n");
  assert.deepEqual(loadAppEnv(root, app, {}), { API_PORT: "3000" });
});

function workspace(t) {
  const { root } = envFiles(t);
  const dir = path.dirname(root);
  mkdirSync(path.join(dir, "apps/api"), { recursive: true });
  return dir;
}

test("one root file supplies API, worker and web without leaking API overrides", (t) => {
  const dir = workspace(t);
  writeFileSync(
    path.join(dir, ".env"),
    "DATABASE_URL=postgresql://shared/db\nAPI_PORT=4100\nWEB_PORT=4101\nSEED_ADMIN_PASSWORD='local#secret!'\n",
  );
  const api = loadWorkspaceEnv("api", {}, dir);
  const worker = loadWorkspaceEnv("worker", {}, dir);
  const web = loadWorkspaceEnv("web", {}, dir);
  assert.equal(api.PORT, "4100");
  assert.equal(web.PORT, "4101");
  assert.equal(web.API_URL, "http://localhost:4100");
  assert.equal(web.NEXT_PUBLIC_APP_URL, "http://localhost:4101");
  assert.equal(worker.API_URL, web.API_URL);
  assert.equal(worker.SEED_ADMIN_PASSWORD, api.SEED_ADMIN_PASSWORD);
  assert.equal(api.SEED_ADMIN_PASSWORD, "local#secret!");
  writeFileSync(
    path.join(dir, "apps/api/.env"),
    "DATABASE_URL=postgresql://isolated/db\nAPI_PORT=4200\n",
  );
  assert.equal(loadWorkspaceEnv("api", {}, dir).DATABASE_URL, "postgresql://isolated/db");
  assert.equal(loadWorkspaceEnv("api", {}, dir).PORT, "4200");
  assert.equal(loadWorkspaceEnv("web", {}, dir).DATABASE_URL, "postgresql://shared/db");
});

test("container and hosting values win over local configuration", (t) => {
  const dir = workspace(t);
  writeFileSync(path.join(dir, ".env"), "API_PORT=4100\nDATABASE_URL=postgresql://local/db\n");
  const env = loadWorkspaceEnv(
    "api",
    { PORT: "8080", DATABASE_URL: "postgresql://container/db" },
    dir,
  );
  assert.equal(env.PORT, "8080");
  assert.equal(env.DATABASE_URL, "postgresql://container/db");
  assert.throws(() => loadWorkspaceEnv("unknown", {}, dir), /Aplicação desconhecida/);
});
