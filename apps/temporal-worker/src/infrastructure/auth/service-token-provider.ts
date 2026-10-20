import { ApiError, responseBody } from "../http/api-error";

interface Options {
  apiUrl: string;
  email: string;
  password: string;
  fetch?: typeof fetch;
  now?: () => number;
}

export class ServiceTokenProvider {
  private cached?: { token: string; expiresAt: number };
  private pending?: Promise<string>;
  private readonly fetch: typeof fetch;
  private readonly now: () => number;

  constructor(private readonly options: Options) {
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
  }

  invalidate(token: string) {
    if (this.cached?.token === token) this.cached = undefined;
  }

  getToken(): Promise<string> {
    if (this.cached && this.cached.expiresAt > this.now() + 30_000)
      return Promise.resolve(this.cached.token);
    if (!this.pending) {
      this.pending = this.login().finally(() => {
        this.pending = undefined;
      });
    }
    return this.pending;
  }

  private async login(): Promise<string> {
    const response = await this.fetch(new URL("/auth/login", this.options.apiUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: this.options.email, password: this.options.password }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await responseBody(response)) as { accessToken?: unknown } | null;
    if (!body || typeof body.accessToken !== "string" || !body.accessToken) {
      throw new ApiError(
        "Login do worker não retornou um token válido.",
        502,
        "INVALID_API_RESPONSE",
      );
    }
    let expiresAt = 0;
    try {
      // Expiry is only a cache hint; token verification remains the API's responsibility.
      const encodedPayload = body.accessToken.split(".")[1];
      if (!encodedPayload) throw new Error("JWT sem payload");
      const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString()) as {
        exp?: number;
      };
      if (typeof payload.exp === "number" && Number.isFinite(payload.exp))
        expiresAt = payload.exp * 1_000;
    } catch {
      /* Tokens without a readable expiry are not cached. */
    }
    this.cached = { token: body.accessToken, expiresAt };
    return body.accessToken;
  }
}
