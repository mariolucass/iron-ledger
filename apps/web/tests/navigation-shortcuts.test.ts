import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  navigationChildren,
  navigationItems,
  navigationRecordMatches,
  navigationRoute,
  navigationRoutes,
  navigationShortcutItems,
} from "../src/shared/config/app-navigation";

const appRoot = fileURLToPath(new URL("../src/app/", import.meta.url));
const files = (directory: string): string[] => readdirSync(directory).flatMap((entry) => {
  const path = resolve(directory, entry);
  return statSync(path).isDirectory() ? files(path) : [path];
});

/** "/(operations)/warehouses/[id]/page.tsx" e "/warehouses/[id]" viram "/warehouses/[]". */
const routeKey = (path: string) =>
  `/${path.split("/").filter((part) => part && !/^\(.+\)$/.test(part)).map((part) => (/^\[.+\]$/.test(part) ? "[]" : part)).join("/")}`;

/** Páginas fora do shell autenticado. */
const publicRoutes = new Set(["/", "/login", "/register"]);

const pageRoutes = () => new Set(
  files(appRoot)
    .filter((file) => file.endsWith("/page.tsx"))
    .map((file) => routeKey(relative(appRoot, file).replace(/\/?page\.tsx$/, ""))),
);

test("numeric shortcuts are declared once and keep their destinations", () => {
  const declared = navigationItems.filter((item) => item.shortcut);
  assert.equal(navigationShortcutItems.size, declared.length, "duplicated shortcut");
  assert.deepEqual(Object.fromEntries([...navigationShortcutItems].map(([key, item]) => [key, item.path])), {
    1: "/dashboard", 2: "/alerts", 3: "/inventory", 4: "/transactions", 5: "/products",
    6: "/warehouses", 7: "/analytics", 8: "/forecasting", 9: "/reports",
  });
});

test("sidebar children use static pages and the current record only", () => {
  const users = navigationItems.find((item) => item.path === "/users")!;
  const warehouse = navigationItems.find((item) => item.path === "/warehouses")!;
  const id = "00000000-0000-4000-8000-000000000001";
  const locationId = "00000000-0000-4000-8000-000000000002";

  assert.deepEqual(navigationChildren(users, "/users/audit-log").map((child) => child.path), [
    "/users", "/users/invitations", "/users/roles", "/users/permissions", "/users/audit-log",
  ]);
  assert.deepEqual(navigationChildren(users, `/users/${id}/edit`).filter((child) => child.record).map((child) => child.path), [
    `/users/${id}`, `/users/${id}/edit`, `/users/${id}/roles`, `/users/${id}/warehouses`,
    `/users/${id}/sessions`, `/users/${id}/security`, `/users/${id}/api-keys`, `/users/${id}/audit-log`,
  ]);
  assert.deepEqual(navigationChildren(users, `/users/roles/${id}/members`).filter((child) => child.record).map((child) => child.path), [
    `/users/roles/${id}`, `/users/roles/${id}/edit`, `/users/roles/${id}/permissions`, `/users/roles/${id}/members`,
  ]);
  assert.deepEqual(navigationChildren(warehouse, `/warehouses/${id}/inventory`).filter((child) => child.record).map((child) => child.path), [
    `/warehouses/${id}`, `/warehouses/${id}/edit`, `/warehouses/${id}/inventory`, `/warehouses/${id}/locations`,
    `/warehouses/${id}/movements`, `/warehouses/${id}/reservations`, `/warehouses/${id}/transfers`, `/warehouses/${id}/counts`,
    `/warehouses/${id}/access`, `/warehouses/${id}/settings`, `/warehouses/${id}/audit-log`,
  ]);
  assert.equal(
    navigationChildren(warehouse, `/warehouses/${id}/locations/${locationId}`).at(-1)?.path,
    `/warehouses/${id}/locations/${locationId}`,
  );
  assert.equal(navigationChildren(users, "/users/roles/new").some((child) => child.record), false);
  assert.deepEqual(
    navigationRecordMatches(`/warehouses/${id}/locations/${locationId}`).map(({ label, path, params }) => ({ label, path, params })),
    [
      { label: "Armazém", path: `/warehouses/${id}`, params: [id] },
      { label: "Localização", path: `/warehouses/${id}/locations/${locationId}`, params: [id, locationId] },
    ],
  );
  assert.equal(navigationChildren(users, `/warehouses/${id}`).some((child) => child.record), false);
});

test("sidebar children list collections, not create or import actions", () => {
  for (const item of navigationItems) {
    for (const child of item.children ?? []) {
      assert.doesNotMatch(child.path, /\/(new|import)$/, `${child.path}: declare actions in hidden`);
    }
  }
});

test("every navigation destination resolves to a routed page", () => {
  const routes = pageRoutes();
  for (const { pattern, page } of navigationRoutes) {
    assert.equal(routes.has(routeKey(pattern)), page, page ? `${pattern}: missing app route` : `${pattern}: declared without page but routed`);
  }
});

test("every authenticated page is declared in the navigation", () => {
  const declared = new Set(navigationRoutes.map(({ pattern }) => routeKey(pattern)));
  const routes = pageRoutes();
  for (const route of routes) {
    if (publicRoutes.has(route)) continue;
    assert.ok(declared.has(route), `${route}: add it to children, records or hidden`);
    const parts = route.split("/").filter(Boolean);
    for (let length = 1; length < parts.length; length++) {
      const prefix = `/${parts.slice(0, length).join("/")}`;
      assert.ok(routes.has(prefix) || declared.has(prefix), `${prefix}: breadcrumb segment without page; declare it with page: false`);
    }
  }
});

test("breadcrumb labels come from the declared route", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const label = (pathname: string) => navigationRoute(pathname)?.label;
  assert.equal(label("/inventory"), "Estoque");
  assert.equal(label("/system/settings"), "Parâmetros");
  assert.equal(label(`/warehouses/${id}/settings`), "Parâmetros");
  assert.equal(label("/settings"), "Configurações");
  assert.equal(label(`/products/${id}/audit-log`), "Auditoria");
  assert.equal(label("/products/new"), "Novo produto");
  assert.equal(label(`/users/${id}`), "Usuário");
  assert.equal(label(`/products/${id}`), "Produto");
  assert.equal(label(`/reports/runs/${id}`), "Execução");
  assert.equal(label(`/warehouses/${id}/locations/${id}`), "Localização");
  assert.equal(label("/analytics/inflection-points/estoque-medio"), "Ponto de inflexão");
  assert.equal(navigationRoute("/analytics/inflection-points")?.page, false);
  assert.equal(label("/unknown"), undefined);
});
