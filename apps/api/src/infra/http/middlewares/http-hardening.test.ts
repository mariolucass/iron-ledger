import type { AddressInfo } from "node:net";
import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/domain.error";
import { errorHandler } from "./error-handler.middleware";
import { securityHeaders } from "./security-headers.middleware";

let baseUrl = "";
let close = () => {};

beforeAll(() => {
  const app = express();
  app.use(securityHeaders);
  app.use(express.json({ limit: "1kb" }));
  app.post("/", (request, response) => {
    response.json(request.body);
  });
  app.get("/conflict", () => {
    throw new AppError("Conflito.", 409, "CONFLICT");
  });
  app.use(errorHandler);
  const server = app.listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => server.close();
});
afterAll(() => close());

const post = (body: string) =>
  fetch(baseUrl, { method: "POST", headers: { "content-type": "application/json" }, body });

describe("endurecimento HTTP", () => {
  it("envia os headers de segurança em toda resposta", async () => {
    const response = await post("{}");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("responde 400 para JSON malformado em vez de 500", async () => {
    const response = await post("{oops");
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "INVALID_JSON" });
  });

  it("devolve o correlation ID no corpo do erro", async () => {
    const response = await fetch(`${baseUrl}/conflict`, {
      headers: { "x-correlation-id": "corr-42" },
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "CONFLICT",
      message: "Conflito.",
      correlationId: "corr-42",
    });
  });

  it("responde 413 para corpo acima do limite em vez de 500", async () => {
    const response = await post(JSON.stringify({ text: "a".repeat(2_000) }));
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ error: "PAYLOAD_TOO_LARGE" });
  });
});
