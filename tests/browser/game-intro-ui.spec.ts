import { expect, test } from "@playwright/test";

const games = [
  { route: "/jeux/lettres/", title: "Découvrir les lettres avec Pana" },
  { route: "/jeux/bateau/", title: "Maîtriser les syllabes avec Pana" },
  { route: "/jeux/mots/", title: "Le Sentier des mots" },
] as const;

test.describe("Introduction commune des jeux", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const game of games) {
    test(`${game.route} utilise l’introduction et la bulle communes`, async ({ page }) => {
      await page.goto(game.route, { waitUntil: "networkidle" });

      await expect(page.locator(".game-intro__title")).toHaveText(game.title);
      await expect(page.locator(".game-intro__pana--start")).toBeVisible();
      await page.getByRole("button", { name: "Commencer", exact: true }).click();

      const speech = page.locator(".game-intro__speech");
      await expect(page.locator(".game-intro__pana--dialogue")).toBeVisible();
      await expect(speech).toBeVisible();
      await expect(page.getByRole("button", { name: "Passer", exact: true })).toBeVisible();

      const pointerContent = await speech.evaluate(
        (element) => getComputedStyle(element, "::before").content,
      );
      expect(pointerContent).not.toBe("none");
    });
  }
});
