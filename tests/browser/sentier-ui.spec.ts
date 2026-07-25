import { expect, test, type Page } from "@playwright/test";

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

async function expectBackdrop(page: Page, pathCount: 0 | 1 | 2 | 3 | 4 | 5) {
  const backdrop = page.getByTestId("sentier-backdrop");
  await expect(backdrop).toHaveAttribute("data-path-count", String(pathCount));
  await expect(backdrop).toHaveAttribute(
    "src",
    new RegExp(`jungle-crossroads-${pathCount}-test\\.webp$`),
  );
  await expect
    .poll(() =>
      backdrop.evaluate(
        (element) =>
          (element as HTMLImageElement).complete &&
          (element as HTMLImageElement).naturalWidth > 0,
      ),
    )
    .toBe(true);
}

test.describe("Le Sentier des mots", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const viewport of viewports) {
    test(`la scène couvre tout le cadre à ${viewport.width}x${viewport.height}`, async ({
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

      expect(scene.y).toBeLessThanOrEqual(game.y + 5);
      expect(hud.y).toBeGreaterThanOrEqual(scene.y - 1);
      expect(hud.y + hud.height).toBeLessThanOrEqual(scene.y + scene.height + 1);
      expect(scene.x).toBeLessThanOrEqual(game.x + 5);
      expect(scene.x + scene.width).toBeGreaterThanOrEqual(game.x + game.width - 5);
      expect(scene.y + scene.height).toBeGreaterThanOrEqual(game.y + game.height - 5);
      expect(overlaps(scene, controls)).toBe(true);
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

  test("cinq réponses utilisent deux rangées au-dessus de la scène", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/jeux/mots/?test=1&choices=5");
    await expect(page.getByTestId("sentier-choice")).toHaveCount(5);
    await expectBackdrop(page, 5);

    const game = await page.getByTestId("sentier-game").boundingBox();
    const scene = await page.getByTestId("sentier-scene").boundingBox();
    const choices = await page.getByTestId("sentier-choices").boundingBox();
    expect(game).not.toBeNull();
    expect(scene).not.toBeNull();
    expect(choices).not.toBeNull();

    if (game && scene && choices) {
      expect(scene.y + scene.height).toBeGreaterThanOrEqual(game.y + game.height - 5);
      expect(overlaps(scene, choices)).toBe(true);
    }
  });

  test("un carrefour sur deux est retourné sans inverser les ruines", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto("/jeux/mots/?test=1&question=0");
    await expect(page.getByTestId("sentier-backdrop")).not.toHaveClass(
      /jungle-scene__backdrop--mirrored/,
    );

    await page.goto("/jeux/mots/?test=1&question=1");
    await expect(page.getByTestId("sentier-backdrop")).toHaveClass(
      /jungle-scene__backdrop--mirrored/,
    );

    await page.goto("/jeux/mots/?test=1&state=treasure");
    await expect(page.getByTestId("sentier-backdrop")).not.toHaveClass(
      /jungle-scene__backdrop--mirrored/,
    );
  });

  test("le demi-tour conserve un unique bouton visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/jeux/mots/?test=1&state=uturn");
    await expect(page.getByTestId("sentier-choice")).toHaveCount(1);
    await expectBackdrop(page, 0);
    const directionIcon = page.locator(".sentier-choice__direction");
    await expect(directionIcon.locator("svg")).toBeVisible();
    await expect(directionIcon.locator("path")).toHaveCount(2);
    const iconBox = await directionIcon.boundingBox();
    expect(iconBox?.width).toBeGreaterThanOrEqual(30);
    await expect(page.getByText("Je crois qu’il faut faire demi-tour !")).toBeVisible();
  });

  test("les zooms latéraux gardent toujours l’image sur tout le cadre", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });

    for (const viewport of [
      { width: 375, height: 812 },
      { width: 1280, height: 900 },
    ]) {
      for (const [word, direction] of [
        ["moto", "far-left"],
        ["maison", "forward"],
        ["bateau", "far-right"],
      ] as const) {
        await page.setViewportSize(viewport);
        await page.goto("/jeux/mots/?test=1&choices=5");
        await page
          .getByTestId("sentier-choices")
          .getByRole("button", { name: word, exact: true })
          .click();
        await expect(page.getByTestId("sentier-scene")).toHaveClass(
          new RegExp(`jungle-scene--${direction}`),
        );
        await page.waitForTimeout(320);

        const scene = await page.getByTestId("sentier-scene").boundingBox();
        const world = await page.locator(".jungle-scene__world").boundingBox();
        expect(scene).not.toBeNull();
        expect(world).not.toBeNull();

        if (scene && world) {
          expect(world.x).toBeLessThanOrEqual(scene.x + 1);
          expect(world.y).toBeLessThanOrEqual(scene.y + 1);
          expect(world.x + world.width).toBeGreaterThanOrEqual(scene.x + scene.width - 1);
          expect(world.y + world.height).toBeGreaterThanOrEqual(scene.y + scene.height - 1);
        }
      }
    }
  });

  test("le demi-tour assombrit la scène puis charge la question suivante", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/jeux/mots/?test=1&state=uturn");
    await page.getByTestId("sentier-choice").click();
    await expect(page.getByTestId("sentier-scene")).toHaveClass(/jungle-scene--uturn/);
    await page.waitForTimeout(300);

    const worldTransform = await page
      .locator(".jungle-scene__world")
      .evaluate((element) => getComputedStyle(element).transform);
    const shadeOpacity = await page
      .getByTestId("sentier-scene")
      .evaluate((element) => Number.parseFloat(getComputedStyle(element, "::after").opacity));

    expect(worldTransform).toBe("none");
    expect(shadeOpacity).toBeGreaterThan(0.5);

    await expect(page.getByTestId("sentier-scene")).not.toHaveClass(/jungle-scene--uturn/);
    await expect(page.getByTestId("sentier-choice")).toHaveCount(3);
    await expect(page.getByText("C’est bon, on a retrouvé notre chemin !")).toBeVisible();
    await expect(page.getByTestId("sentier-choice").first()).toBeDisabled();
    const clearedShadeOpacity = await page
      .getByTestId("sentier-scene")
      .evaluate((element) => Number.parseFloat(getComputedStyle(element, "::after").opacity));
    expect(clearedShadeOpacity).toBe(0);
    await expect(page.getByText("C’est bon, on a retrouvé notre chemin !")).toHaveCount(0);
    await expect(page.getByTestId("sentier-choice").first()).toBeEnabled();
  });

  test("une motte masque deux gemmes puis les envoie vers le compteur", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/jeux/mots/?test=1&choices=5");
    const initialScore = await page.getByTestId("sentier-gem-count").textContent();
    await page
      .getByTestId("sentier-choices")
      .getByRole("button", { name: "moto", exact: true })
      .click();

    const mound = page.getByTestId("sentier-reward-mound");
    await expect(mound).toBeVisible();
    await expect(page.getByText("Niveau 1 · Mot 2/8")).toBeVisible();
    await expect(
      page.getByTestId("sentier-target").getByRole("img", { name: "panda" }),
    ).toBeVisible();
    const gems = mound.locator(".jungle-scene__hidden-gem");
    await expect(gems).toHaveCount(2);
    await expect(page.getByTestId("sentier-gem-count")).toHaveText(initialScore ?? "0");
    await expect(page.getByTestId("sentier-choice").first()).toBeDisabled();

    const positions = await gems.evaluateAll((elements) =>
      elements.map((element) => ({
        left: (element as HTMLElement).offsetLeft,
        top: (element as HTMLElement).offsetTop,
      })),
    );
    expect(positions[0]?.left).toBeLessThan(positions[1]?.left ?? 0);

    await mound.click();
    await expect(page.getByTestId("sentier-gem-flights")).toBeVisible();
    await expect(page.getByTestId("sentier-gem-count")).toHaveText("2", {
      timeout: 3_000,
    });
    await expect(page.getByTestId("sentier-choice").first()).toBeDisabled();
    await expect(page.getByTestId("sentier-choice").first()).toBeEnabled();
  });

  test("une seule motte masque aussi une récompense d’une gemme", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/jeux/mots/?test=1&errors=1");
    await page
      .getByTestId("sentier-choices")
      .getByRole("button", { name: "moto", exact: true })
      .click();

    const mound = page.getByTestId("sentier-reward-mound");
    await expect(mound).toBeVisible();
    await expect(mound.locator(".jungle-scene__hidden-gem")).toHaveCount(1);
    await expect(page.getByText("Niveau 1 · Mot 2/8")).toBeVisible();
    await expect(
      page.getByTestId("sentier-target").getByRole("img", { name: "panda" }),
    ).toBeVisible();
    await mound.click();
    await expect(page.getByTestId("sentier-gem-count")).toHaveText("1", {
      timeout: 2_000,
    });
  });

  test("le trésor final exige deux clics et ajoute huit gemmes avant le résultat", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/jeux/mots/?test=1&state=treasure");

    await expect(page.getByTestId("sentier-backdrop")).toHaveAttribute(
      "src",
      /jungle-destination-ruins\.webp$/,
    );
    await expect(page.getByTestId("sentier-controls")).toHaveCount(0);
    await expect(page.getByTestId("sentier-treasure-mound")).toBeVisible();
    await expect(page.getByTestId("sentier-buried-chest")).toHaveCount(0);
    await expect(page.getByTestId("sentier-gem-count")).toHaveText("2");

    await page.getByTestId("sentier-treasure-mound").click();
    await expect(page.getByTestId("sentier-treasure-mound")).toHaveCount(0);
    await expect(page.getByTestId("sentier-buried-chest")).toBeVisible();
    await expect(page.getByText("Un coffre ! Ouvre-le !")).toBeVisible();

    await page.getByTestId("sentier-buried-chest").click();
    await expect(page.getByTestId("sentier-open-chest")).toBeVisible();
    await expect(page.getByTestId("sentier-gem-flights")).toBeVisible();
    await expect(page.getByTestId("sentier-gem-count")).toHaveText("10", {
      timeout: 4_000,
    });
    await expect(page.getByTestId("sentier-result")).toBeVisible();
    await expect(page.getByText("10 gemmes collectées")).toBeVisible();
    await expect(page.getByText(/\/(?:16|24)/)).toHaveCount(0);
  });

  test("la cascade normale du coffre se termine sans action supplémentaire", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/jeux/mots/?test=1&state=treasure-revealed");

    await page.getByTestId("sentier-buried-chest").click();
    await expect(page.getByTestId("sentier-gem-flights")).toBeVisible();
    await expect(page.getByTestId("sentier-result")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("sentier-gem-count")).toHaveText("10");
  });

  test("le huitième mot rejoint les ruines avant d’afficher le trésor", async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/jeux/mots/?test=1&question=7");

    await page.getByRole("button", { name: "maison", exact: true }).click();
    const rewardMound = page.getByTestId("sentier-reward-mound");
    await expect(rewardMound).toBeVisible();
    await expectBackdrop(page, 1);
    await expect(page.locator(".sentier-game__test")).toHaveCount(0);
    await expect(page.getByTestId("sentier-game")).toHaveScreenshot(
      `${testInfo.project.name}-dernier-chemin.png`,
    );
    await expect(page.getByTestId("sentier-result")).toHaveCount(0);
    await rewardMound.click();

    await expect(page.getByTestId("sentier-scene")).toHaveClass(
      /jungle-scene--destination-travelling/,
      { timeout: 4_000 },
    );
    await expect(page.locator(".jungle-scene__destination-previous")).toBeVisible();
    await expect(page.getByTestId("sentier-backdrop")).toHaveAttribute(
      "src",
      /jungle-destination-ruins\.webp$/,
    );
    await expect(page.getByTestId("sentier-treasure-mound")).toBeVisible();
    await expect(page.getByTestId("sentier-treasure-mound")).toBeDisabled();
    await expect(page.getByTestId("sentier-result")).toHaveCount(0);
    await expect(page.getByTestId("sentier-treasure-mound")).toBeVisible({
      timeout: 2_000,
    });
    await expect(page.locator(".jungle-scene__destination-previous")).toHaveCount(0);
  });

  test("une erreur retire le chemin choisi puis rend le contrôle", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/jeux/mots/?test=1");
    await expectBackdrop(page, 3);
    await page.getByRole("button", { name: "melon" }).click();
    await expect(page.getByTestId("sentier-choice")).toHaveCount(2, { timeout: 8_000 });
    await expectBackdrop(page, 2);
    await expect(page.getByRole("button", { name: "melon" })).toHaveCount(0);
    await expect(
      page.getByTestId("sentier-choices").getByRole("button", { name: "moto" }),
    ).toBeEnabled();
  });

  test("une erreur à cinq choix charge le carrefour à quatre chemins", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/jeux/mots/?test=1&choices=5");
    await page.getByRole("button", { name: "melon", exact: true }).click();
    await expect(page.getByTestId("sentier-choice")).toHaveCount(4, { timeout: 8_000 });
    await expectBackdrop(page, 4);
  });

  test("l’accueil et le dialogue suivent la structure commune des jeux", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/jeux/mots/?test=1&state=intro");

    await expect(page.getByRole("heading", { name: "Le Sentier des mots" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Commencer" })).toBeVisible();

    await page.goto("/jeux/mots/?test=1&state=dialogue");
    const pana = page.locator(".game-intro__pana--dialogue");
    const speech = page.locator(".game-intro__speech");

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

  for (const viewport of [
    { name: "mobile", width: 375, height: 812 },
    { name: "desktop", width: 1280, height: 900 },
  ] as const) {
    test(`captures des étapes du trésor sur ${viewport.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);

      for (const [name, state, visibleAsset] of [
        ["enterre", "treasure", "sentier-treasure-mound"],
        ["revele", "treasure-revealed", "sentier-buried-chest"],
        ["ouvert", "treasure-open", "sentier-open-chest"],
        ["resultat-tresor", "result", "sentier-open-chest"],
      ] as const) {
        await page.goto(`/jeux/mots/?test=1&state=${state}`);
        await expect(page.getByTestId(visibleAsset)).toBeVisible();
        await expect(page.getByTestId("sentier-backdrop")).toHaveAttribute(
          "src",
          /jungle-destination-ruins\.webp$/,
        );
        await expect
          .poll(() =>
            page.getByTestId("sentier-backdrop").evaluate(
              (element) =>
                (element as HTMLImageElement).complete &&
                (element as HTMLImageElement).naturalWidth > 0,
            ),
          )
          .toBe(true);

        const horizontalOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(horizontalOverflow).toBeLessThanOrEqual(1);

        const sceneBox = await page.getByTestId("sentier-scene").boundingBox();
        const assetBox = await page.getByTestId(visibleAsset).boundingBox();
        expect(sceneBox).not.toBeNull();
        expect(assetBox).not.toBeNull();

        if (sceneBox && assetBox) {
          const assetCenterX = assetBox.x + assetBox.width / 2;
          const assetCenterY = assetBox.y + assetBox.height / 2;
          expect(Math.abs(assetCenterX - (sceneBox.x + sceneBox.width / 2))).toBeLessThan(
            sceneBox.width * 0.02,
          );
          expect(Math.abs(assetCenterY - (sceneBox.y + sceneBox.height * 0.64))).toBeLessThan(
            sceneBox.height * 0.03,
          );
        }

        await expect(page.getByTestId("sentier-game")).toHaveScreenshot(
          `${testInfo.project.name}-${viewport.name}-tresor-${name}.png`,
        );
      }
    });
  }

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
