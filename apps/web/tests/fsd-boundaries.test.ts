import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
const layers = ["app", "views", "widgets", "features", "entities", "shared"];
const files = (directory: string): string[] => readdirSync(directory).flatMap((entry) => {
  const path = resolve(directory, entry);
  return statSync(path).isDirectory() ? files(path) : /\.[tj]sx?$/.test(path) ? [path] : [];
});

test("slices only depend on lower layers and external slice imports use public APIs", () => {
  for (const file of files(sourceRoot)) {
    const [layer, slice] = relative(sourceRoot, file).split("/");
    if (!layers.includes(layer)) continue;
    const source = readFileSync(file, "utf8");
    const imports = source.matchAll(/(?:from\s*|import\s*\()(["'])([^"']+)\1/g);
    for (const [, , specifier] of imports) {
      if (!specifier.startsWith("@/") && !specifier.startsWith(".")) continue;
      const target = specifier.startsWith("@/")
        ? resolve(sourceRoot, specifier.slice(2))
        : resolve(dirname(file), specifier);
      const parts = relative(sourceRoot, target).split("/");
      const [targetLayer, targetSlice] = parts;
      if (!layers.includes(targetLayer)) continue;
      const sameSlice = layer === targetLayer && (layer === "app" || layer === "shared" || slice === targetSlice);
      if (sameSlice) continue;
      assert.ok(layers.indexOf(targetLayer) > layers.indexOf(layer), `${relative(sourceRoot, file)} -> ${specifier}: invalid layer dependency`);
      if (targetLayer !== "shared" && targetLayer !== "app") {
        assert.ok(parts.length === 2 || (parts.length === 3 && ["entities", "views"].includes(targetLayer) && ["testing", "server"].includes(parts[2])), `${specifier}: bypasses public API`);
      }
    }
  }
});

test("features expose actions rather than entire routed pages", () => {
  const slices = readdirSync(resolve(sourceRoot, "features"));
  assert.ok(slices.length > 0);
  for (const slice of slices) {
    assert.match(slice, /^[a-z]+(?:-[a-z]+)*$/, "Feature slices should describe actions without route groups");
    assert.ok(readFileSync(resolve(sourceRoot, "features", slice, "index.ts"), "utf8").trim());
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
