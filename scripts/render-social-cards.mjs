import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const sourceDirectory = resolve(root, ".tmp/social-art");
const outputDirectory = resolve(root, ".tmp/social-final");

const cards = [
  {
    filename: "readingo-lettres",
    eyebrow: "Connaître les lettres · 5 à 7 ans",
    title: ["L’Observatoire", "des lettres"],
  },
  {
    filename: "readingo-syllabes",
    eyebrow: "Maîtriser les syllabes · 5 à 7 ans",
    title: ["L’Archipel", "des mots"],
  },
  {
    filename: "readingo-mots",
    eyebrow: "Reconnaître les mots · 5 à 7 ans",
    title: ["Le Sentier", "des mots"],
  },
  {
    filename: "readingo-guides",
    eyebrow: "Guides pour les parents",
    title: ["Accompagner", "les premiers pas", "en lecture"],
    compact: true,
  },
];

const [icon, font] = await Promise.all([
  readFile(resolve(root, "public/assets/Readingo_Icon.png")),
  readFile(resolve(root, "public/assets/fonts/nunito-latin.ttf")),
]);

const asDataUrl = (mimeType, buffer) =>
  `data:${mimeType};base64,${buffer.toString("base64")}`;

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

for (const card of cards) {
  const background = await readFile(
    resolve(sourceDirectory, `${card.filename}.png`),
  );
  const title = card.title
    .map((line) => `<span>${escapeHtml(line)}</span>`)
    .join("");

  await page.setContent(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <style>
          @font-face {
            font-family: "Nunito";
            src: url("${asDataUrl("font/ttf", font)}") format("truetype");
            font-style: normal;
            font-weight: 100 1000;
          }

          * { box-sizing: border-box; }

          html, body {
            width: 1200px;
            height: 630px;
            margin: 0;
            overflow: hidden;
          }

          body {
            background: #fffaf0;
            color: #08214a;
            font-family: "Nunito", system-ui, sans-serif;
          }

          .card {
            position: relative;
            width: 1200px;
            height: 630px;
            overflow: hidden;
            background-image: url("${asDataUrl("image/png", background)}");
            background-position: center;
            background-size: 1200px 630px;
          }

          .wash {
            position: absolute;
            inset: 0;
            background:
              linear-gradient(
                90deg,
                rgba(255, 250, 240, 0.94) 0%,
                rgba(255, 250, 240, 0.76) 25%,
                rgba(255, 250, 240, 0.2) 43%,
                rgba(255, 250, 240, 0) 54%
              );
          }

          .content {
            position: absolute;
            top: 48px;
            left: 56px;
            width: 480px;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .brand img {
            width: 68px;
            height: 68px;
            object-fit: contain;
          }

          .brand-name {
            font-size: 42px;
            font-weight: 950;
            line-height: 1;
            letter-spacing: -1.5px;
          }

          .eyebrow {
            display: inline-flex;
            align-items: center;
            height: 34px;
            margin-top: 31px;
            padding: 0 15px;
            border-radius: 999px;
            background: #ffc42f;
            color: #08214a;
            font-size: 16px;
            font-weight: 900;
            line-height: 1;
            letter-spacing: 0.35px;
            text-transform: uppercase;
          }

          h1 {
            width: 470px;
            margin: 18px 0 0;
            font-size: ${card.compact ? "48px" : "54px"};
            font-weight: 950;
            line-height: ${card.compact ? "1.01" : "0.99"};
            letter-spacing: -2px;
          }

          h1 span {
            display: block;
          }

          .underline {
            width: 126px;
            height: 9px;
            margin-top: 19px;
            border-radius: 999px;
            background: #ffc42f;
          }
        </style>
      </head>
      <body>
        <main class="card">
          <div class="wash"></div>
          <section class="content">
            <div class="brand">
              <img src="${asDataUrl("image/png", icon)}" alt="" />
              <div class="brand-name">Readingo</div>
            </div>
            <div class="eyebrow">${escapeHtml(card.eyebrow)}</div>
            <h1>${title}</h1>
            <div class="underline"></div>
          </section>
        </main>
      </body>
    </html>
  `);

  await page.screenshot({
    path: resolve(outputDirectory, `${card.filename}.png`),
    type: "png",
  });
}

await browser.close();

console.log(`Rendered ${cards.length} social cards in ${outputDirectory}`);
