import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// React Flight may pass its -Infinity sentinel to performance.measure() when a
// Server Component aborts or errors. Keep this workaround scoped to the bundled
// clients in Next 16.4.2 until React's upstream fix reaches a Next release.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const requireWeb = createRequire(path.join(root, "apps/web/package.json"));
let nextPackagePath;
try {
  nextPackagePath = requireWeb.resolve("next/package.json");
} catch (error) {
  if (error.code === "MODULE_NOT_FOUND") {
    console.log("Next.js is not installed; skipping React Flight patch.");
    process.exit(0);
  }
  throw error;
}

const nextPackage = JSON.parse(readFileSync(nextPackagePath, "utf8"));
if (nextPackage.version !== "16.4.2") {
  console.log(`Next.js ${nextPackage.version} does not need the 16.4.2 patch.`);
  process.exit(0);
}

const nextRoot = path.dirname(nextPackagePath);
for (const bundler of ["turbopack", "turbopack-experimental", "webpack", "webpack-experimental"]) {
  const filename = `react-server-dom-${bundler.replace("-experimental", "")}-client.browser.development.js`;
  const file = path.join(nextRoot, "dist/compiled", `react-server-dom-${bundler}`, "cjs", filename);
  const originalSource = readFileSync(file, "utf8");
  let source = originalSource;
  for (const [original, fixed] of [
    [
      "if (supportsUserTiming) {\n                      var env = componentInfo$jscomp$2.env,",
      "if (supportsUserTiming && 0 <= childrenEndTime$jscomp$1) {\n                      var env = componentInfo$jscomp$2.env,",
    ],
    [
      "if (supportsUserTiming) {\n                    var env$jscomp$2 = componentInfo$jscomp$4.env,",
      "if (supportsUserTiming && 0 <= childrenEndTime$jscomp$3) {\n                    var env$jscomp$2 = componentInfo$jscomp$4.env,",
    ],
  ]) {
    if (source.includes(original)) {
      source = source.replace(original, fixed);
    } else if (!source.includes(fixed)) {
      throw new Error(`Unexpected React Flight code in ${file}; patch was not applied.`);
    }
  }
  if (source !== originalSource) writeFileSync(file, source);
}

console.log("Patched React Flight performance timing in Next.js 16.4.2.");
