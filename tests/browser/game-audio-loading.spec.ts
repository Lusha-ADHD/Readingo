import { expect, test } from "@playwright/test";

const games = [
  { route: "/jeux/lettres/", ambience: "/assets/audio/sfx/night-loop.mp3" },
  { route: "/jeux/bateau/", ambience: "/assets/audio/sfx/sea-loop.mp3" },
  { route: "/jeux/mots/", ambience: "/assets/audio/sfx/jungle-loop.mp3" },
] as const;

test.describe("Chargement audio à la demande", () => {
  for (const game of games) {
    test(`${game.route} ne charge que son ambiance au démarrage`, async ({ page }) => {
      const requestedEffects = new Set<string>();

      await page.route("**/assets/audio/sfx/**", async (route) => {
        requestedEffects.add(new URL(route.request().url()).pathname);
        await route.abort();
      });

      await page.goto(game.route, { waitUntil: "networkidle" });
      expect(requestedEffects.size).toBe(0);

      await page.getByRole("button", { name: "Commencer", exact: true }).click();
      await expect.poll(() => requestedEffects.has(game.ambience)).toBe(true);
      await page.waitForTimeout(100);

      expect([...requestedEffects]).toEqual([game.ambience]);
    });
  }
});
