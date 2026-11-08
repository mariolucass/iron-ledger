import { expect, test } from "@playwright/test";

test("o login valida os campos antes de chamar a API", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  await page.getByRole("button", { name: /^Entrar/ }).last().click();
  await expect(page.getByText("Informe seu email corporativo.")).toBeVisible();
  await expect(page.getByText("Informe sua senha.")).toBeVisible();
});
