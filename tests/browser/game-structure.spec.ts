import { expect, test } from "@playwright/test";

test.describe("Structure des jeux après découpage", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("Syllabes affiche ensemble scène, HUD et défi", async ({ page }) => {
    await page.goto("/jeux/syllabes/?niveau=1", { waitUntil: "networkidle" });

    await expect(page.locator(".syllabes-game--playing")).toBeVisible();
    await expect(page.locator(".syllabes-game__world")).toBeVisible();
    await expect(page.locator(".syllabes-game__boat")).toBeVisible();
    await expect(page.locator(".syllabes-game__hud")).toBeVisible();
    await expect(page.locator(".syllabes-game__panel")).toBeVisible();
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

  test("Lettres affiche une carte céleste avec un niveau jouable", async ({
    page,
  }) => {
    await page.goto("/jeux/lettres/?etat=carte", {
      waitUntil: "networkidle",
    });

    await expect(page.locator(".letters-map")).toBeVisible();
    await expect(page.locator(".letters-map__node")).toHaveCount(12);
    await expect(page.locator(".letters-map__node:not(:disabled)")).toHaveCount(1);
    await expect(page.locator(".letters-map__node--locked")).toHaveCount(11);
    await expect(page.locator(".letters-map__node--coming")).toHaveCount(0);
    await expect(page.locator(".letters-map__tutorial-pointer")).toBeVisible();
    await expect(page.getByText("À venir", { exact: true })).toHaveCount(0);

    const lastConstellation = page.locator(".letters-map__node").last();
    await lastConstellation.scrollIntoViewIfNeeded();
    await expect(lastConstellation).toBeVisible();
    await expect(lastConstellation).toBeDisabled();

    await page.locator(".letters-map__node:not(:disabled)").click();
    await expect(page.locator(".letters-game--question")).toBeVisible();
    await expect(page.locator(".letters-game__challenge")).toBeVisible();
  });

  test("Lettres ouvre la carte après l’introduction", async ({ page }) => {
    await page.goto("/jeux/lettres/", { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "Commencer" }).click();
    await expect(page.locator(".letters-game--dialog")).toBeVisible();
    await page.getByRole("button", { name: "Passer" }).click();

    await expect(page.locator(".letters-map")).toBeVisible();
    await expect(page.locator(".letters-map__node:not(:disabled)")).toHaveCount(1);
  });

  test("Lettres conserve une carte utilisable à 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 650 });
    await page.goto("/jeux/lettres/?etat=carte", {
      waitUntil: "networkidle",
    });

    await expect(page.locator(".letters-map")).toBeVisible();
    await expect(page.locator(".letters-map__tutorial-pointer")).toBeVisible();
    await expect
      .poll(() =>
        page.locator(".letters-map").evaluate((map) => map.scrollWidth <= map.clientWidth),
      )
      .toBe(true);

    const playableConstellation = page.locator(".letters-map__node:not(:disabled)");
    await expect(playableConstellation).toBeInViewport();
    await playableConstellation.click();
    await expect(page.locator(".letters-game--question")).toBeVisible();
  });

  test("Lettres revient à la carte depuis le résultat", async ({ page }) => {
    await page.goto("/jeux/lettres/?etat=resultat", {
      waitUntil: "networkidle",
    });

    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect(page.locator(".letters-map")).toBeVisible();
  });

  test("Lettres reprend sur la carte et permet de rejouer un niveau terminé", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "readingo:lettres:v1",
        JSON.stringify({
          version: 1,
          unlockedLevel: 1,
          completedLevels: [1],
          sessions: 1,
        }),
      );
    });
    await page.goto("/jeux/lettres/?reprendre=1", {
      waitUntil: "networkidle",
    });

    await expect(page.locator(".letters-map")).toBeVisible();
    await expect(page.locator(".letters-map__node--complete")).toHaveCount(1);
    await expect(page.locator(".letters-map__node--frontier")).toHaveCount(1);
    await expect(page.locator(".letters-map__tutorial-pointer")).toHaveCount(1);
    await expect(page.locator(".letters-map__node:not(:disabled)")).toHaveCount(2);

    await page.locator(".letters-map__node--complete").click();
    await expect(page.locator(".letters-game--question")).toBeVisible();
  });

  test("Lettres ouvre directement le niveau 12 en mode local", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/jeux/lettres/?niveau=12", { waitUntil: "networkidle" });

    await expect(page.locator(".letters-game__hud")).toContainText("Niveau 12");
    await expect(page.locator(".letter-tile")).toHaveCount(6);
    const labels = await page.locator(".letter-tile__choice span").allTextContents();
    expect(labels.some((label) => label === label.toLocaleUpperCase("fr-FR"))).toBe(true);
    expect(labels.some((label) => label === label.toLocaleLowerCase("fr-FR"))).toBe(true);
    await expect
      .poll(() => page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth))
      .toBe(true);
    const tileBoxes = await page.locator(".letter-tile__choice").evaluateAll((tiles) =>
      tiles.map((tile) => {
        const box = tile.getBoundingClientRect();
        return { width: box.width, height: box.height };
      }),
    );
    expect(tileBoxes.every(({ width, height }) => width >= 80 && height >= 62)).toBe(true);
  });

  for (const { level, expectedWord } of [
    { level: 1, expectedWord: "ANANAS" },
    { level: 5, expectedWord: "ananas" },
    { level: 9, expectedWord: "ananas" },
    { level: 12, expectedWord: "wagon" },
  ]) {
    test(`Lettres révèle le mot dans la casse attendue au niveau ${level}`, async ({
      page,
    }) => {
      await page.goto(`/jeux/lettres/?niveau=${level}`, {
        waitUntil: "networkidle",
      });

      const answerName = level === 12 ? "Choisir la lettre double vé" : "Choisir la lettre a";
      await page.getByRole("button", { name: answerName, exact: true }).click();
      await expect(page.locator(".letters-game__word-reveal .sr-only")).toHaveText(
        expectedWord,
      );
    });
  }

  test("Sentier affiche ensemble jungle, HUD et défi", async ({ page }) => {
    await page.goto("/jeux/mots/?test=1", { waitUntil: "networkidle" });

    await expect(page.locator(".jungle-scene")).toBeVisible();
    await expect(page.locator(".sentier-game__hud")).toBeVisible();
    await expect(page.locator(".sentier-challenge")).toBeVisible();
  });
});
