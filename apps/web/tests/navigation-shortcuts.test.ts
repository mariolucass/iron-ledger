import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { navigationChildren, navigationItems, navigationShortcutItems } from "../src/shared/config/app-navigation";

const appRoot = fileURLToPath(new URL("../src/app/", import.meta.url));
const files = (directory: string): string[] => readdirSync(directory).flatMap((entry) => {
  const path = resolve(directory, entry);
  return statSync(path).isDirectory() ? files(path) : [path];
});

/** "/(operations)/warehouses/[id]/page.tsx" e "/warehouses/[id]" viram "/warehouses/[]". */
const routeKey = (path: string) =>
  `/${path.split("/").filter((part) => part && !/^\(.+\)$/.test(part)).map((part) => (/^\[.+\]$/.test(part) ? "[]" : part)).join("/")}`;

test("numeric shortcuts follow the first nine sidebar destinations in visual order", () => {
  assert.equal(navigationShortcutItems.size, 9);
  assert.deepEqual(
    navigationItems.map((item) => item.shortcut),
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ...Array(navigationItems.length - 9).fill(undefined)],
  );
  for (const item of navigationItems.slice(0, 9)) {
    assert.equal(navigationShortcutItems.get(item.shortcut!), item);
  }
});

test("sidebar children use static pages and the current record only", () => {
  const users = navigationItems.find((item) => item.path === "/users")!;
  const warehouse = navigationItems.find((item) => item.path === "/warehouses")!;
  const id = "00000000-0000-4000-8000-000000000001";
  const locationId = "00000000-0000-4000-8000-000000000002";

  assert.deepEqual(navigationChildren(users, "/users/audit-log").map((child) => child.path), [
    "/users", "/users/new", "/users/invitations", "/users/roles", "/users/permissions", "/users/audit-log",
  ]);
  assert.deepEqual(navigationChildren(users, `/users/${id}/edit`).filter((child) => child.contextual).map((child) => child.path), [
    `/users/${id}`, `/users/${id}/edit`, `/users/${id}/roles`, `/users/${id}/warehouses`,
    `/users/${id}/sessions`, `/users/${id}/security`, `/users/${id}/api-keys`, `/users/${id}/audit-log`,
  ]);
  assert.deepEqual(navigationChildren(users, `/users/roles/${id}/members`).filter((child) => child.contextual).map((child) => child.path), [
    `/users/roles/${id}`, `/users/roles/${id}/edit`, `/users/roles/${id}/permissions`, `/users/roles/${id}/members`,
  ]);
  assert.deepEqual(navigationChildren(warehouse, `/warehouses/${id}/inventory`).filter((child) => child.contextual).map((child) => child.path), [
    `/warehouses/${id}`, `/warehouses/${id}/edit`, `/warehouses/${id}/inventory`, `/warehouses/${id}/locations`,
    `/warehouses/${id}/movements`, `/warehouses/${id}/reservations`, `/warehouses/${id}/transfers`, `/warehouses/${id}/counts`,
    `/warehouses/${id}/access`, `/warehouses/${id}/settings`, `/warehouses/${id}/audit-log`,
  ]);
  assert.equal(
    navigationChildren(warehouse, `/warehouses/${id}/locations/${locationId}`).at(-1)?.path,
    `/warehouses/${id}/locations/${locationId}`,
  );
  assert.equal(navigationChildren(users, "/users/roles/new").some((child) => child.contextual), false);
  assert.equal(navigationChildren(users, `/warehouses/${id}`).some((child) => child.contextual), false);
});

test("every navigation destination resolves to a routed page", () => {
  const routes = new Set(
    files(appRoot)
      .filter((file) => file.endsWith("/page.tsx"))
      .map((file) => routeKey(relative(appRoot, file).replace(/\/?page\.tsx$/, ""))),
  );
  const destinations = navigationItems.flatMap((item) => [
    item.path,
    ...(item.children ?? []).map((child) => child.path),
    ...(item.records ?? []).flatMap((record) => record.pages.map((page) => `${record.pattern}${page.suffix ?? ""}`)),
  ]);
  for (const destination of destinations) {
    assert.ok(routes.has(routeKey(destination)), `${destination}: missing app route`);
  }
});
