import type { RequestHandler } from "express";

/**
 * Headers de segurança para uma API que só devolve JSON (equivalente ao
 * `secureHeaders` do Hono/`helmet`). Sem HTML servido, a CSP bloqueia tudo e
 * nenhuma resposta pode ser embutida em frame.
 */
const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Cross-Origin-Opener-Policy": "same-origin",
  // Só afeta requests `no-cors`; chamadas com CORS continuam regidas pelo `cors()`.
  "Cross-Origin-Resource-Policy": "same-origin",
  "Origin-Agent-Cluster": "?1",
  "Referrer-Policy": "no-referrer",
  // Ignorado pelo navegador fora de HTTPS.
  "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-DNS-Prefetch-Control": "off",
  "X-Download-Options": "noopen",
  "X-Frame-Options": "DENY",
  "X-Permitted-Cross-Domain-Policies": "none",
  // Desativa o filtro legado, que introduzia vulnerabilidades próprias.
  "X-XSS-Protection": "0",
};

export const securityHeaders: RequestHandler = (_request, response, next) => {
  response.set(SECURITY_HEADERS);
  next();
};
