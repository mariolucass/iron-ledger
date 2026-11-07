import { GatewayError } from "../gateway-error";

export class ApiError extends GatewayError {
  constructor(
    message: string,
    readonly status: number,
    code?: string,
  ) {
    super(
      message,
      code ?? `HTTP_${status}`,
      status >= 500 ||
        status === 408 ||
        status === 429 ||
        (status === 409 && (code === "STOCK_CONFLICT" || code === "CONCURRENT_OPERATION")),
      { status, code },
    );
    this.name = "ApiError";
  }
}

export async function responseBody(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    throw new ApiError(
      typeof record.message === "string"
        ? record.message
        : `API indisponível: HTTP ${response.status}.`,
      response.status,
      typeof record.error === "string" ? record.error : undefined,
    );
  }
  return body;
}
