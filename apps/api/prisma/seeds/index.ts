import { loadWorkspaceEnv } from "../../../../scripts/lib/app-env.cjs";
import { PrismaClient } from "@prisma/client";
import { catalogSeed } from "./catalog.seed";
import { identitySeed } from "./identity.seed";
import { inventorySeed } from "./inventory.seed";
import type { Seed } from "./types";
import { warehouseSeed } from "./warehouse.seed";

Object.assign(process.env, loadWorkspaceEnv("api"));

/** Ordem de execução. Novos seeds entram aqui. */
const seeds: readonly Seed[] = [identitySeed, warehouseSeed, catalogSeed, inventorySeed];

/**
 * Seleciona seeds por nome via `--only=a,b` ou `SEED_ONLY=a,b`, incluindo
 * as dependências declaradas. Sem filtro, roda todos.
 */
function selectSeeds(argv: readonly string[]): Seed[] {
  const raw =
    argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length) ?? process.env.SEED_ONLY;
  if (!raw) return [...seeds];

  const byName = new Map(seeds.map((seed) => [seed.name, seed]));
  const selected = new Set<string>();
  const include = (name: string): void => {
    const seed = byName.get(name);
    if (!seed)
      throw new Error(
        `Seed desconhecido: "${name}". Disponíveis: ${[...byName.keys()].join(", ")}.`,
      );
    if (selected.has(name)) return;
    seed.dependsOn?.forEach(include);
    selected.add(name);
  };
  raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .forEach(include);

  return seeds.filter((seed) => selected.has(seed.name));
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    for (const seed of selectSeeds(process.argv.slice(2))) {
      const startedAt = Date.now();
      await seed.run({ prisma, log: (message) => console.log(`  [${seed.name}] ${message}`) });
      console.log(`✔ ${seed.name} (${Date.now() - startedAt}ms)`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
