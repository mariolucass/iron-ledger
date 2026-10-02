type JsonObject = Record<string, unknown>;

async function token(): Promise<string> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Credenciais de serviço do worker não configuradas.");
  const response = await fetch(new URL("/auth/login", process.env.API_URL ?? "http://localhost:3000"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Login do worker falhou: HTTP ${response.status}`);
  const body = await response.json() as { accessToken?: string };
  if (!body.accessToken) throw new Error("Login do worker não retornou token.");
  return body.accessToken;
}

export async function apiRequest<T>(path: string, body: JsonObject): Promise<T> {
  const accessToken = await token();
  const response = await fetch(new URL(path, process.env.API_URL ?? "http://localhost:3000"), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) throw new Error(`API ${path}: HTTP ${response.status} ${result?.message ?? ""}`);
  return result as T;
}
