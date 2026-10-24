import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ACTIONS_GROUP,
  groupSearchEntries,
  recordSearchEntries,
  searchEntries,
  searchNavigation,
} from "../src/features/platform/search-navigation/model/search-entries";

const search = (query: string) => searchNavigation(searchEntries, query);

test("search indexes modules, subpages and actions without dynamic routes", () => {
  const paths = searchEntries.map(({ path }) => path);
  assert.ok(paths.includes("/products"));
  assert.ok(paths.includes("/products/categories"));
  assert.ok(paths.includes("/products/new"));
  assert.ok(paths.includes("/inventory/counts/new"));
  assert.equal(paths.some((path) => path.includes("[")), false);
  assert.equal(new Set(paths).size, paths.length, "duplicated search destination");
});

test("search ignores accents and ranks label matches first", () => {
  assert.equal(search("transacao")[0]?.path, "/transactions");
  assert.equal(search("novo produto")[0]?.path, "/products/new");
  assert.equal(search("importar")[0]?.group, ACTIONS_GROUP);
  assert.deepEqual(search("categ").map(({ path }) => path).slice(0, 2), ["/products/categories", "/products/categories/new"]);
  assert.ok(search("produtos").some(({ path }) => path === "/products/units-of-measure"), "context matches the module");
  assert.deepEqual(search("zzz"), []);
});

test("search offers the pages of the record in the current route", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const entries = recordSearchEntries(`/warehouses/${id}/inventory`);
  assert.deepEqual(groupSearchEntries(entries).map(([group]) => group), ["Neste registro · Armazém"]);
  assert.equal(searchNavigation(entries, "editar")[0]?.path, `/warehouses/${id}/edit`);
  assert.deepEqual(recordSearchEntries("/warehouses/new"), []);
});
