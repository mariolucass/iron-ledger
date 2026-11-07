import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { ModuleContext, WorkerModule } from "../shared/worker-module";

export const MODULES_DIR = join(__dirname, "..", "modules");

export interface DiscoveredModule {
  name: string;
  module: WorkerModule;
  /** Ponto de entrada dos workflows do módulo, quando ele tem workflows. */
  workflowsEntry?: string;
}

/** Resolve `<base>.ts` (dev/tsx) ou `<base>.js` (dist); `undefined` se não existir. */
function resolveSource(base: string): string | undefined {
  return [".ts", ".js"].map((ext) => base + ext).find((file) => existsSync(file));
}

/** Descobre `modules/*` com um `module.ts`. A ordem é alfabética para ser determinística. */
export function discoverModules(modulesDir: string = MODULES_DIR): DiscoveredModule[] {
  return readdirSync(modulesDir)
    .sort()
    .filter((name) => statSync(join(modulesDir, name)).isDirectory())
    .flatMap((name): DiscoveredModule[] => {
      const file = resolveSource(join(modulesDir, name, "module"));
      if (!file) return [];
      const { workerModule } = require(file) as { workerModule?: WorkerModule };
      if (!workerModule || workerModule.name !== name) {
        throw new Error(
          `modules/${name}/module deve exportar \`workerModule\` com name "${name}".`,
        );
      }
      const workflowsEntry = resolveSource(join(modulesDir, name, "workflows", "index"));
      return [{ name, module: workerModule, workflowsEntry }];
    });
}

/** Une as activities de todos os módulos; um nome repetido seria sobrescrito em silêncio. */
export function composeActivities(
  modules: readonly DiscoveredModule[],
  context: ModuleContext,
): Record<string, unknown> {
  const owners = new Map<string, string>();
  const activities: Record<string, unknown> = {};
  for (const { name, module } of modules) {
    for (const [activity, implementation] of Object.entries(module.createActivities(context))) {
      const owner = owners.get(activity);
      if (owner) {
        throw new Error(`Activity "${activity}" registrada pelos módulos "${owner}" e "${name}".`);
      }
      owners.set(activity, name);
      activities[activity] = implementation;
    }
  }
  return activities;
}
