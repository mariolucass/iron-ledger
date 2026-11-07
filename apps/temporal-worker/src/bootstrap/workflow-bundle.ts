import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { bundleWorkflowCode, type WorkflowBundle } from "@temporalio/worker";
import type { DiscoveredModule } from "./module-registry";

/**
 * O Temporal exige um único ponto de entrada de workflows. Em vez de um barrel
 * versionado (que todo módulo editaria), ele é gerado a partir dos `workflows/index`
 * de cada módulo e descartado após o bundle.
 */
// O bundler resolve `@temporalio/workflow` a partir da pasta da entrada, então ela precisa
// ficar dentro do pacote (src/bootstrap e dist/bootstrap estão a dois níveis da raiz).
const SCRATCH_DIR = join(__dirname, "..", "..", "node_modules", ".cache", "iron-ledger");

export async function bundleModuleWorkflows(
  modules: readonly DiscoveredModule[],
  tracingEnabled = false,
): Promise<WorkflowBundle> {
  const entries = modules.flatMap(({ workflowsEntry }) => (workflowsEntry ? [workflowsEntry] : []));
  if (entries.length === 0) throw new Error("Nenhum módulo expõe workflows.");

  await mkdir(SCRATCH_DIR, { recursive: true });
  const directory = await mkdtemp(join(SCRATCH_DIR, "workflows-"));
  try {
    const entry = join(directory, "workflows.js");
    await writeFile(
      entry,
      entries
        .map((file) => `export * from ${JSON.stringify(file.replace(/\.(ts|js)$/, ""))};`)
        .join("\n"),
    );
    return await bundleWorkflowCode({
      workflowsPath: entry,
      workflowInterceptorModules: tracingEnabled
        ? [require.resolve("@temporalio/interceptors-opentelemetry/lib/workflow-interceptors")]
        : [],
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
