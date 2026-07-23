import { expect, test } from "@playwright/test";

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const viewports = [
  { width: 320, height: 640 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
];

function overlaps(left: Box, right: Box) {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

test.describe("Le Sentier des mots", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const viewport of viewports) {
    test(`les trois rangées ne se recouvrent pas à ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/jeux/mots/?test=1");
      await expect(page.getByTestId("sentier-controls")).toBeVisible();

      const game = await page.getByTestId("sentier-game").boundingBox();
      const hud = await page.getByTestId("sentier-hud").boundingBox();
      const scene = await page.getByTestId("sentier-scene").boundingBox();
      const controls = await page.getByTestId("sentier-controls").boundingBox();

      expect(game).not.toBeNull();
      expect(hud).not.toBeNull();
      expect(scene).not.toBeNull();
      expect(controls).not.toBeNull();

      if (!game || !hud || !scene || !controls) {
        return;
      }

      expect(hud.y + hud.height).toBeLessThanOrEqual(scene.y + 1);
      expect(scene.y + scene.height).toBeLessThanOrEqual(controls.y + 1);
      expect(scene.height).toBeGreaterThanOrEqual(viewport.width <= 700 ? 170 : 220);
      expect(controls.y + controls.height).toBeLessThanOrEqual(game.y + game.height + 1);

      const horizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(horizontalOverflow).toBeLessThanOrEqual(1);

      const target = await page.getByTestId("sentier-target").boundingBox();
      const speaker = await page.locator(".sentier-challenge__audio").boundingBox();
      expect(target).not.toBeNull();
      expect(speaker).not.toBeNull();

      if (target && speaker) {
        expect(speaker.x).toBeGreaterThan(target.x + target.width * 0.55);
        expect(speaker.y).toBeLessThan(target.y + target.height * 0.35);
        expect(speaker.x + speaker.width).toBeLessThanOrEqual(target.x + target.width + 12);
      }

      const choices = await page.getByTestId("sentier-choice").evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        }),
      );

      for (let left = 0; left < choices.length; left += 1) {
        for (let right = left + 1; right < choices.length; right += 1) {
          expect(overlaps(choices[left], choices[right])).toBe(false);
        }
      }
    });
  }

  test("cinq réponses utilisent deux rangées sans couvrir la scène", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/jeux/mots/?test=1&choices=5");
    await expect(page.getByTestId("sentier-choice")).toHaveCount(5);

    const scene = await page.getByTestId("sentier-scene").boundingBox();
    const choices = await page.getByTestId("sentier-choices").boundingBox();
    expect(scene).not.toBeNull();
    expect(choices).not.toBeNull();

    if (scene && choices) {
      expect(scene.y + scene.height).toBeLessThanOrEqual(choices.y);
      expect(scene.height).toBeGreaterThanOrEqual(170);
    }
  });

  test("le demi-tour conserve un unique bouton visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/jeux/mots/?test=1&state=uturn");
    await expect(page.getByTestId("sentier-choice")).toHaveCount(1);
    await expect(page.locator(".sentier-choice__direction svg")).toBeVisible();
    await expect(page.getByText("Je crois qu’il faut faire demi-tour !")).toBeVisible();
  });

  test("une erreur retire le chemin choisi puis rend le contrôle", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/jeux/mots/?test=1");
    await page.getByRole("button", { name: "melon" }).click();
    await expect(page.getByTestId("sentier-choice")).toHaveCount(2, { timeout: 8_000 });
    await expect(page.getByRole("button", { name: "melon" })).toHaveCount(0);
    await expect(
      page.getByTestId("sentier-choices").getByRole("button", { name: "moto" }),
    ).toBeEnabled();
  });

  test("l’accueil et le dialogue suivent la structure commune des jeux", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/jeux/mots/?test=1&state=intro");

    await expect(page.getByRole("heading", { name: "Le Sentier des mots" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Commencer" })).toBeVisible();

    await page.goto("/jeux/mots/?test=1&state=dialogue");
    const pana = page.locator(".sentier-opening__pana--dialogue");
    const speech = page.locator(".sentier-opening__speech");

    await expect(pana).toBeVisible();
    await expect(speech).toBeVisible();
    await expect(page.getByRole("button", { name: "Passer", exact: true })).toBeVisible();

    const panaBox = await pana.boundingBox();
    const speechBox = await speech.boundingBox();
    expect(panaBox).not.toBeNull();
    expect(speechBox).not.toBeNull();

    if (panaBox && speechBox) {
      expect(panaBox.y + panaBox.height).toBeLessThan(speechBox.y);
    }

    const pointerContent = await speech.evaluate(
      (element) => getComputedStyle(element, "::before").content,
    );
    expect(pointerContent).not.toBe("none");
  });

  test("captures visuelles des états structurants", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });

    for (const [name, query] of [
      ["accueil", "?test=1&state=intro"],
      ["dialogue", "?test=1&state=dialogue"],
      ["question", "?test=1"],
      ["erreur", "?test=1&errors=1"],
      ["demi-tour", "?test=1&state=uturn"],
      ["resultat", "?test=1&state=result"],
    ] as const) {
      await page.goto(`/jeux/mots/${query}`);
      await expect(page.getByTestId("sentier-game")).toBeVisible();
      await expect(page.getByTestId("sentier-game")).toHaveScreenshot(
        `${testInfo.project.name}-${name}.png`,
      );
    }
  });
});
