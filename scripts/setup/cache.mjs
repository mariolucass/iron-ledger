import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { rootDir } from "../lib/workspace.cjs";

const cachePath = path.join(rootDir, ".bootstrap-cache.json");

/** Guarda o hash dos manifestos já instalados para pular instalações sem mudanças. */
export function loadCache() {
  try {
    const parsed = JSON.parse(readFileSync(cachePath, "utf8"));
    parsed.python ??= {};
    return parsed;
  } catch {
    return { python: {} };
  }
}

export function saveCache(cache) {
  try {
    writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch {
    // cache is a pure optimization; failing to write it is never fatal
  }
}

export function hashFile(filePath) {
  return existsSync(filePath)
    ? createHash("sha256").update(readFileSync(filePath)).digest("hex")
    : null;
}
