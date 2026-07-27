import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, ".tmp/readingo-home-final.png");

const [background, icon, font] = await Promise.all([
  readFile(resolve(root, "public/assets/social/readingo-home-style-test.png")),
  readFile(resolve(root, "public/assets/Readingo_Icon.png")),
  readFile(resolve(root, "public/assets/fonts/nunito-latin.ttf")),
]);

const asDataUrl = (mimeType, buffer) =>
  `data:${mimeType};base64,${buffer.toString("base64")}`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

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
          background: #dff8fb;
          font-family: "Nunito", system-ui, sans-serif;
          color: #08214a;
        }

        .card {
          position: relative;
          width: 1200px;
          height: 630px;
          overflow: hidden;
          background-image: url("${asDataUrl("image/png", background)}");
          background-size: 1200px 630px;
          background-position: center;
        }

        .wash {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(255, 250, 240, 0.93) 0%,
              rgba(255, 250, 240, 0.74) 25%,
              rgba(255, 250, 240, 0.18) 43%,
              rgba(255, 250, 240, 0) 54%
            );
        }

        .content {
          position: absolute;
          top: 48px;
          left: 56px;
          width: 470px;
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
          line-height: 1;
          font-weight: 950;
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
          font-size: 17px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        h1 {
          width: 460px;
          margin: 18px 0 0;
          font-size: 53px;
          line-height: 0.99;
          font-weight: 950;
          letter-spacing: -2px;
          text-wrap: balance;
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
      <main class="card" aria-label="Readingo, apprendre à lire devient une aventure">
        <div class="wash"></div>
        <section class="content">
          <div class="brand">
            <img src="${asDataUrl("image/png", icon)}" alt="" />
            <div class="brand-name">Readingo</div>
          </div>
          <div class="eyebrow">Jeux de lecture · 5 à 7 ans</div>
          <h1>Apprendre à lire devient une aventure</h1>
          <div class="underline"></div>
        </section>
      </main>
    </body>
  </html>
`);

await page.screenshot({ path: outputPath, type: "png" });
await browser.close();

console.log(outputPath);
