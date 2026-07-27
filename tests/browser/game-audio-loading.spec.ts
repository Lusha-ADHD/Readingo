import { expect, test } from "@playwright/test";

const games = [
  {
    route: "/jeux/lettres/",
    startupAudio: ["/assets/audio/sfx/night-loop.mp3"],
  },
  {
    route: "/jeux/syllabes/",
    startupAudio: ["/assets/audio/sfx/sea-loop.mp3"],
  },
  {
    route: "/jeux/mots/",
    startupAudio: [
      "/assets/audio/sfx/jungle-loop.mp3",
      "/assets/audio/sfx/jungle-step.mp3",
    ],
  },
] as const;

test.describe("Chargement audio à la demande", () => {
  for (const game of games) {
    test(`${game.route} ne charge que ses sons de démarrage`, async ({ page }) => {
      const requestedEffects = new Set<string>();

      await page.route("**/assets/audio/sfx/**", async (route) => {
        requestedEffects.add(new URL(route.request().url()).pathname);
        await route.abort();
      });

      await page.goto(game.route, { waitUntil: "networkidle" });
      expect(requestedEffects.size).toBe(0);

      await page.getByRole("button", { name: "Commencer", exact: true }).click();
      await expect
        .poll(() =>
          game.startupAudio.every((audio) => requestedEffects.has(audio)),
        )
        .toBe(true);
      await page.waitForTimeout(100);

      expect(requestedEffects).toEqual(new Set(game.startupAudio));
    });
  }

  test("les premiers bruitages Syllabes sont chargés au clic", async ({
    page,
  }) => {
    const requestedAudio = new Set<string>();
    page.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;

      if (pathname.includes("/assets/audio/")) {
        requestedAudio.add(pathname);
      }
    });

    await page.goto("/jeux/syllabes/?niveau=1");
    await expect(page.locator(".bateau-game--playing")).toBeVisible();
    await page.locator(".syllable-tile").first().click();
    await expect
      .poll(() => requestedAudio.has("/assets/audio/sfx/syllable-select.mp3"))
      .toBe(true);
    await expect
      .poll(() => requestedAudio.has("/assets/audio/sfx/syllable-drop.mp3"))
      .toBe(true);
  });

  test("le premier bruitage Lettres est chargé au clic", async ({ page }) => {
    const requestedAudio = new Set<string>();
    page.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;

      if (pathname.includes("/assets/audio/")) {
        requestedAudio.add(pathname);
      }
    });

    await page.goto("/jeux/lettres/?question=1");
    await page.getByRole("button", { name: "Choisir la lettre A" }).click();
    await expect
      .poll(() => requestedAudio.has("/assets/audio/sfx/syllable-drop.mp3"))
      .toBe(true);
  });

  test("le Sentier prononce le choix et charge la fouille des gemmes", async ({
    page,
  }) => {
    const requestedAudio = new Set<string>();
    page.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;

      if (pathname.includes("/assets/audio/")) {
        requestedAudio.add(pathname);
      }
    });

    await page.goto("/jeux/mots/?test=1");
    await page.getByRole("button", { name: "melon", exact: true }).click();
    await expect
      .poll(() => requestedAudio.has("/assets/audio/fr/words/melon.mp3"))
      .toBe(true);

    requestedAudio.clear();
    await page.goto("/jeux/mots/?test=1");
    await page.getByRole("button", { name: "moto", exact: true }).click();
    await page.getByTestId("sentier-reward-mound").click();
    await expect
      .poll(() => requestedAudio.has("/assets/audio/sfx/digging.mp3"))
      .toBe(true);
  });

  test("le Sentier charge le son de fouille du coffre", async ({ page }) => {
    const requestedAudio = new Set<string>();
    page.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;

      if (pathname.includes("/assets/audio/")) {
        requestedAudio.add(pathname);
      }
    });

    await page.goto("/jeux/mots/?test=1&state=treasure");
    await page.getByTestId("sentier-treasure-mound").click();
    await expect
      .poll(() => requestedAudio.has("/assets/audio/sfx/digging.mp3"))
      .toBe(true);
  });
});
