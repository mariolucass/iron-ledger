import type { ServiceTokenProvider } from "../auth/service-token-provider";
import { responseBody } from "./api-error";

export class ApiClient {
  constructor(
    private readonly apiUrl: string,
    private readonly tokens: Pick<ServiceTokenProvider, "getToken" | "invalidate">,
    private readonly fetch: typeof globalThis.fetch = globalThis.fetch,
  ) {}

  async request(method: "GET" | "POST", path: string, body?: object, correlationId?: string): Promise<unknown> {
    let token = await this.tokens.getToken();
    const send = () => this.fetch(new URL(path, this.apiUrl), {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body ? { "content-type": "application/json" } : {}),
        ...(correlationId ? { "x-correlation-id": correlationId } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15_000),
    });
    let response = await send();
    if (response.status === 401) {
      await response.body?.cancel();
      this.tokens.invalidate(token);
      token = await this.tokens.getToken();
      response = await send();
    }
    return responseBody(response);
  }
}
