import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { setTimeout } from "node:timers/promises";

// No DATABASE_URL is read: all SQL runs inside a disposable PostgreSQL container.
const root = new URL("../apps/api/prisma/", import.meta.url);
const container = `iron-ledger-integrity-${randomUUID()}`;
const target = "20261020120000_enforce_domain_integrity";
function docker(args, input) {
  const result = spawnSync("docker", args, { input, encoding: "utf8", timeout: 120_000, maxBuffer: 8 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `docker exited ${result.status}`);
  return result.stdout;
}
try {
  docker(["run", "--detach", "--rm", "--name", container, "-e", "POSTGRES_PASSWORD=integrity-test", "-e", "POSTGRES_DB=integrity_test", "postgres:16-alpine"]);
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      // TCP waits for the final server, not the temporary initialization socket.
      docker(["exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "postgres", "-d", "integrity_test"]);
      ready = true;
      break;
    } catch { await setTimeout(500); }
  }
  if (!ready) throw new Error("Disposable PostgreSQL did not become ready");
  const migrations = readdirSync(new URL("migrations/", root), { withFileTypes: true })
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  if (!migrations.includes(target)) throw new Error("Integrity migration not found");
  const statements = [];
  for (const migration of migrations) {
    if (migration === target) statements.push(readFileSync(new URL("tests/integrity-fixture.sql", root), "utf8"));
    statements.push(readFileSync(new URL(`migrations/${migration}/migration.sql`, root), "utf8"));
  }
  statements.push(readFileSync(new URL("tests/integrity-assertions.sql", root), "utf8"));
  docker(["exec", "-i", container, "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "integrity_test"], statements.join("\n"));
  console.log("PASS: all migrations, existing-data backfills, balances, composite FKs, nullable uniqueness, alert deduplication and immutable audit history (PostgreSQL 16).");
} finally {
  const result = spawnSync("docker", ["rm", "--force", container], { encoding: "utf8", timeout: 15_000 });
  if (result.status !== 0 && !result.stderr?.includes("No such container")) {
    console.error(`Could not remove test container ${container}: ${result.stderr}`);
    process.exitCode = 1;
  }
}
