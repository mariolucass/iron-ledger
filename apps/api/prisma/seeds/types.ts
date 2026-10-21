import type { PrismaClient } from "@prisma/client";

export interface SeedContext {
  prisma: PrismaClient;
  log: (message: string) => void;
}

/**
 * Unidade de seed. `dependsOn` lista os seeds que precisam ter rodado antes;
 * o runner os inclui automaticamente quando apenas parte deles é selecionada.
 */
export interface Seed {
  name: string;
  dependsOn?: readonly string[];
  run: (context: SeedContext) => Promise<void>;
}

/** UUID determinístico para manter a massa estável entre execuções. */
export function seedId(prefix: number, index: number): string {
  return `${String(prefix).padStart(8, "0")}-0000-4000-8000-${String(index).padStart(12, "0")}`;
}
