import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { test } from "node:test";

/**
 * Fronteiras que mantêm os módulos independentes entre si, para vários devs
 * trabalharem em paralelo sem tocar nos mesmos arquivos:
 *
 * - `modules/<a>` nunca importa `modules/<b>` nem `bootstrap`;
 * - `shared` e `bootstrap` não conhecem detalhes de módulo (o bootstrap só descobre);
 * - `workflows/` roda no sandbox determinístico do Temporal: nada de gateways, activities
 *   ou `shared` (I/O). Só tipos, políticas, contratos e o SDK de workflow.
 */
const SRC = resolve(__dirname, "..", "src");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sources(path);
    return path.endsWith(".ts") && !path.includes(`${sep}tests${sep}`) ? [path] : [];
  });
}

function imports(file: string): { specifier: string; typeOnly: boolean }[] {
  const code = readFileSync(file, "utf8");
  const found = [...code.matchAll(/^(?:import|export)\s+(type\s+)?[^;]*?from\s+"([^"]+)"/gms)];
  return found.map((match) => ({ specifier: match[2]!, typeOnly: Boolean(match[1]) }));
}

function violations(): string[] {
  const problems: string[] = [];
  for (const file of sources(SRC)) {
    const from = relative(SRC, file).split(sep);
    const module = from[0] === "modules" ? from[1] : undefined;
    const layer = module ? from[2] : undefined;
    for (const { specifier, typeOnly } of imports(file)) {
      if (!specifier.startsWith(".")) continue;
      const target = relative(SRC, resolve(dirname(file), specifier)).split(sep);
      const report = (reason: string) =>
        problems.push(`${from.join("/")} → ${specifier}: ${reason}`);

      if (module && target[0] === "bootstrap") report("módulos não conhecem o bootstrap");
      if (module && target[0] === "modules" && target[1] !== module) {
        report(`módulo "${module}" não pode importar o módulo "${target[1]}"`);
      }
      if (from[0] === "shared" && (target[0] === "modules" || target[0] === "bootstrap")) {
        report("shared não depende de módulos nem do bootstrap");
      }
      if (from[0] === "bootstrap" && target[0] === "modules") {
        report("o bootstrap descobre módulos em runtime; não os importa");
      }
      if (layer === "workflows" && target[0] === "shared") {
        report("workflows são determinísticos e não podem usar shared (I/O)");
      }
      if (layer === "workflows" && target[0] === "modules" && target[1] === module) {
        const targetLayer = target[2];
        const pure = targetLayer === "workflows" || targetLayer === "policies";
        if (!pure && !(typeOnly && targetLayer === "contracts")) {
          report(
            `workflows só importam workflows/ e policies/ (e tipos de contracts/), não ${targetLayer}/`,
          );
        }
      }
    }
  }
  return problems;
}

test("modules, shared and bootstrap respect their dependency boundaries", () => {
  assert.deepEqual(violations(), []);
});

test("every module folder exposes a module.ts so the bootstrap can discover it", () => {
  const modules = join(SRC, "modules");
  for (const name of readdirSync(modules)) {
    assert.ok(
      readdirSync(join(modules, name)).includes("module.ts"),
      `modules/${name} precisa de module.ts`,
    );
  }
});
