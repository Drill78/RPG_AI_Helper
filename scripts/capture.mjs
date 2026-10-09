import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1080 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const errors = [];
const failures = [];
page.on("requestfailed", (request) => failures.push(request.url()));
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await mkdir("output/qa", { recursive: true });
await page.goto(process.env.CAPTURE_URL || "http://127.0.0.1:4173", {
  waitUntil: "networkidle",
});
await page.locator(".hero").waitFor();
await page.screenshot({ path: "output/qa/desktop-home.png", fullPage: true });
console.log(
  JSON.stringify(
    {
      title: await page.title(),
      errors,
      failures,
      brokenImages: await page
        .locator("img")
        .evaluateAll(
          (images) =>
            images.filter(
              (image) => !image.complete || image.naturalWidth === 0,
            ).length,
        ),
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    },
    null,
    2,
  ),
);
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "output/qa/mobile-home.png", fullPage: true });
console.log(
  JSON.stringify({
    mobileOverflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  }),
);
await browser.close();
