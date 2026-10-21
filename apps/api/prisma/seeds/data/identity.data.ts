export const roles = [
  { name: "ADMIN", description: "Administrador do sistema", isSystem: true },
  { name: "WAREHOUSE_MANAGER", description: "Gerencia armazéns e localizações", isSystem: true },
  { name: "CATALOG_MANAGER", description: "Gerencia o catálogo de produtos", isSystem: true },
  {
    name: "SERVICE",
    description: "Conta técnica de serviços internos (worker de sagas)",
    isSystem: true,
  },
] as const;

export type RoleName = (typeof roles)[number]["name"];

export interface SeedUser {
  email: string;
  name: string;
  password: string;
  roles: readonly RoleName[];
}

/** Usuários lidos do ambiente: admin sempre; conta de serviço só se configurada. */
export function usersFromEnv(env: NodeJS.ProcessEnv): SeedUser[] {
  const users: SeedUser[] = [
    {
      email: (env.SEED_ADMIN_EMAIL ?? "admin@ironledger.local").toLowerCase(),
      name: "Administrador",
      password: env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!",
      roles: ["ADMIN"],
    },
  ];

  if (env.WORKER_SERVICE_EMAIL && env.WORKER_SERVICE_PASSWORD) {
    users.push({
      email: env.WORKER_SERVICE_EMAIL.toLowerCase(),
      name: "Temporal Worker",
      password: env.WORKER_SERVICE_PASSWORD,
      roles: ["SERVICE"],
    });
  }

  return users;
}
