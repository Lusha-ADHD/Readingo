import { expect, test } from "@playwright/test";

test.describe("Structure des jeux après découpage", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("Bateau affiche ensemble scène, HUD et défi", async ({ page }) => {
    await page.goto("/jeux/bateau/?niveau=1", { waitUntil: "networkidle" });

    await expect(page.locator(".bateau-game--playing")).toBeVisible();
    await expect(page.locator(".bateau-game__world")).toBeVisible();
    await expect(page.locator(".bateau-game__boat")).toBeVisible();
    await expect(page.locator(".bateau-game__hud")).toBeVisible();
    await expect(page.locator(".bateau-game__panel")).toBeVisible();
  });

  test("Lettres affiche ensemble constellation, HUD et défi", async ({
    page,
  }) => {
    await page.goto("/jeux/lettres/?question=1", {
      waitUntil: "networkidle",
    });

    await expect(page.locator(".constellation-scene")).toBeVisible();
    await expect(page.locator(".letters-game__hud")).toBeVisible();
    await expect(page.locator(".letters-game__challenge")).toBeVisible();
    await expect(page.locator(".letters-game__choices")).toBeVisible();
  });

  test("Sentier affiche ensemble jungle, HUD et défi", async ({ page }) => {
    await page.goto("/jeux/mots/?test=1", { waitUntil: "networkidle" });

    await expect(page.locator(".jungle-scene")).toBeVisible();
    await expect(page.locator(".sentier-game__hud")).toBeVisible();
    await expect(page.locator(".sentier-challenge")).toBeVisible();
  });
});
