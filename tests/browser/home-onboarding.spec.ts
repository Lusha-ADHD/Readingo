import { expect, test } from "@playwright/test";

test("l’onboarding conserve son parcours après son découpage", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });

  const onboarding = page.locator(
    'section[aria-label="Pana t’aide à choisir un jeu"]',
  );
  await expect(onboarding).toBeVisible();

  await onboarding
    .getByRole("button", { name: "Commencer", exact: true })
    .click();
  await expect(
    onboarding.getByText("Bonjour moussaillon !", { exact: false }),
  ).toBeVisible();

  await onboarding
    .getByRole("button", { name: "Continuer", exact: true })
    .click();
  await expect(onboarding.getByText("Pour commencer", { exact: false })).toBeVisible();

  await onboarding
    .locator(".home-onboarding__choice--age")
    .first()
    .locator(".home-onboarding__choice-select")
    .click();
  await expect(
    onboarding.getByText("Dis-moi maintenant", { exact: false }),
  ).toBeVisible();

  await onboarding
    .locator(".home-onboarding__choice--skill")
    .last()
    .locator(".home-onboarding__choice-select")
    .click();
  await expect(
    onboarding.getByText("Le Sentier des mots", { exact: false }),
  ).toBeVisible();
  await expect(
    onboarding.getByRole("link", { name: /Entrer dans la jungle/ }),
  ).toHaveAttribute("href", /\/jeux\/mots\//);
});
