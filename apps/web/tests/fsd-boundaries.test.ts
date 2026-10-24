import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
const layers = ["app", "views", "widgets", "features", "entities", "shared"];
// Camadas com slices agrupadas por domínio: <camada>/<domínio>/<slice>.
const groupedLayers = ["views", "features"];
const sliceDepth = (layer: string) => (groupedLayers.includes(layer) ? 3 : 2);
const sliceOf = (parts: string[]) => parts.slice(1, sliceDepth(parts[0])).join("/");
const directories = (directory: string) => readdirSync(directory).filter((entry) => statSync(resolve(directory, entry)).isDirectory());
const files = (directory: string): string[] => readdirSync(directory).flatMap((entry) => {
  const path = resolve(directory, entry);
  return statSync(path).isDirectory() ? files(path) : /\.[tj]sx?$/.test(path) ? [path] : [];
});

test("slices only depend on lower layers and external slice imports use public APIs", () => {
  for (const file of files(sourceRoot)) {
    const sourceParts = relative(sourceRoot, file).split("/");
    const [layer] = sourceParts;
    if (!layers.includes(layer)) continue;
    const slice = sliceOf(sourceParts);
    const source = readFileSync(file, "utf8");
    const imports = source.matchAll(/(?:from\s*|import\s*\()(["'])([^"']+)\1/g);
    for (const [, , specifier] of imports) {
      if (!specifier.startsWith("@/") && !specifier.startsWith(".")) continue;
      const target = specifier.startsWith("@/")
        ? resolve(sourceRoot, specifier.slice(2))
        : resolve(dirname(file), specifier);
      const parts = relative(sourceRoot, target).split("/");
      const [targetLayer] = parts;
      if (!layers.includes(targetLayer)) continue;
      const sameSlice = layer === targetLayer && (layer === "app" || layer === "shared" || slice === sliceOf(parts));
      if (sameSlice) continue;
      assert.ok(layers.indexOf(targetLayer) > layers.indexOf(layer), `${relative(sourceRoot, file)} -> ${specifier}: invalid layer dependency`);
      if (targetLayer !== "shared" && targetLayer !== "app") {
        const depth = sliceDepth(targetLayer);
        assert.ok(parts.length === depth || (parts.length === depth + 1 && ["entities", "views"].includes(targetLayer) && ["testing", "server"].includes(parts[depth])), `${specifier}: bypasses public API`);
      }
    }
  }
});

test("features expose actions rather than entire routed pages", () => {
  const slices = directories(resolve(sourceRoot, "features")).flatMap((group) =>
    directories(resolve(sourceRoot, "features", group)).map((slice) => [group, slice]),
  );
  assert.ok(slices.length > 0);
  for (const [group, slice] of slices) {
    assert.match(slice, /^[a-z]+(?:-[a-z]+)*$/, "Feature slices should describe actions without route groups");
    assert.ok(readFileSync(resolve(sourceRoot, "features", group, slice, "index.ts"), "utf8").trim());
  }
  assert.ok(files(resolve(sourceRoot, "features")).every((file) => !file.endsWith("Page.tsx")));
});

test("all routed screens resolve through the page layer", () => {
  const routes = files(resolve(sourceRoot, "app")).filter((file) => file.endsWith("/page.tsx"));
  assert.ok(routes.length > 0);
  for (const route of routes) {
    assert.match(readFileSync(route, "utf8"), /from ["']@\/views\//, relative(sourceRoot, route));
  }
});

test("view and feature slices live inside a domain group", () => {
  for (const layer of groupedLayers) {
    for (const group of directories(resolve(sourceRoot, layer))) {
      const groupPath = resolve(sourceRoot, layer, group);
      assert.ok(readdirSync(groupPath).every((entry) => statSync(resolve(groupPath, entry)).isDirectory()), `${layer}/${group}: domain groups hold only slices`);
      for (const slice of directories(groupPath)) {
        assert.ok(statSync(resolve(groupPath, slice, "index.ts")).isFile(), `${layer}/${group}/${slice}: missing public API`);
      }
    }
  }
});
