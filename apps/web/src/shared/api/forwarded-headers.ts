import "server-only";

/**
 * Headers do navegador repassados à API: a cadeia `X-Forwarded-For` (IP do
 * cliente para o rate limit; a API confia em `TRUST_PROXY_HOPS` saltos) e o
 * correlation ID. O Next só preenche `X-Forwarded-For` quando o cliente não o
 * envia, então um proxy de borda deve sobrescrevê-lo em produção.
 */
export function forwardedHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const name of ["x-forwarded-for", "x-correlation-id"]) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  return headers;
}

/** Mantém o `Retry-After` de respostas 429 da API. */
export function retryAfterHeaders(upstream: Response): Record<string, string> {
  const retryAfter = upstream.headers.get("retry-after");
  return retryAfter ? { "retry-after": retryAfter } : {};
}
