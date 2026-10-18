import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { test } from "node:test";
import { createLogger, runWithContext, setContextValue } from "./index";

function capture() {
  const lines: Record<string, unknown>[] = [];
  const destination = new Writable({
    write(chunk, _encoding, done) {
      lines.push(JSON.parse(String(chunk)));
      done();
    },
  });
  return { lines, destination };
}

test("merges the asynchronous context into every line", async () => {
  const { lines, destination } = capture();
  const logger = createLogger({ service: "test", destination });
  await runWithContext({ correlationId: "corr-1" }, async () => {
    setContextValue("userId", "user-1");
    await Promise.resolve();
    logger.info({ step: "reserve" }, "processando");
  });
  logger.info("fora do contexto");
  assert.equal(lines[0]?.correlationId, "corr-1");
  assert.equal(lines[0]?.userId, "user-1");
  assert.equal(lines[0]?.message, "processando");
  assert.equal(lines[0]?.level, "info");
  assert.equal(lines[0]?.service, "test");
  assert.equal(lines[1]?.correlationId, undefined);
});

test("redacts credentials and tokens", () => {
  const { lines, destination } = capture();
  const logger = createLogger({ service: "test", destination });
  logger.info({ password: "secret", body: { accessToken: "jwt" }, headers: { authorization: "Bearer x" } }, "login");
  const line = lines[0]!;
  assert.equal(line.password, "[REDACTED]");
  assert.deepEqual(line.body, { accessToken: "[REDACTED]" });
  assert.deepEqual(line.headers, { authorization: "[REDACTED]" });
});
