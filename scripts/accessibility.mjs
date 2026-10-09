import { chromium } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseURL = process.env.A11Y_BASE_URL || "http://127.0.0.1:4173";
const outputPath = resolve(projectRoot, "output", "qa", "accessibility.json");
const desktopRoutes = [
  "home",
  "guilds",
  "guild/general",
  "lesson/general-brief",
  "prompts",
  "prompt/general-prompt-brief",
  "tools",
  "team",
  "collection",
  "settings",
];
const targets = [
  ...desktopRoutes.map((route) => ({
    route,
    device: "desktop",
    viewport: { width: 1440, height: 1080 },
  })),
  ...["home", "team"].map((route) => ({
    route,
    device: "mobile",
    viewport: { width: 390, height: 844 },
  })),
];
const report = {
  generatedAt: new Date().toISOString(),
  baseURL,
  readOnly: true,
  results: [],
  summary: {},
};
const browser = await chromium.launch({ headless: true });

try {
  for (const target of targets) {
    const context = await browser.newContext({
      viewport: target.viewport,
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      locale: "zh-CN",
    });
    const runtime = {
      pageErrors: [],
      consoleErrors: [],
      failedRequests: [],
      httpErrors: [],
      blockedMutations: [],
    };
    // A scan must never modify the real workspace, even if application behavior changes.
    await context.route("**/api/**", async (route) => {
      if (!["GET", "HEAD", "OPTIONS"].includes(route.request().method())) {
        runtime.blockedMutations.push({
          method: route.request().method(),
          url: route.request().url(),
        });
        await route.abort("blockedbyclient");
      } else await route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => runtime.pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error")
        runtime.consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) =>
      runtime.failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText,
      }),
    );
    page.on("response", (response) => {
      if (response.status() >= 400)
        runtime.httpErrors.push({
          url: response.url(),
          status: response.status(),
        });
    });
    try {
      await page.goto(`${baseURL}/#${target.route}`, {
        waitUntil: "networkidle",
        timeout: 30_000,
      });
      await page
        .locator("main h1")
        .waitFor({ state: "visible", timeout: 15_000 });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map(async (image) => {
            if (image.complete) return;
            await Promise.race([
              new Promise((done) => {
                image.addEventListener("load", done, { once: true });
                image.addEventListener("error", done, { once: true });
              }),
              new Promise((done) => setTimeout(done, 8000)),
            ]);
          }),
        );
        await new Promise((done) =>
          requestAnimationFrame(() => requestAnimationFrame(done)),
        );
      });
      const layout = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const hasOverflow = document.documentElement.scrollWidth > width + 1;
        const selector = (element) => {
          if (element.id) return `#${CSS.escape(element.id)}`;
          const classes = [...element.classList]
            .slice(0, 3)
            .map((name) => `.${CSS.escape(name)}`)
            .join("");
          return `${element.tagName.toLowerCase()}${classes}`;
        };
        const offenders = hasOverflow
          ? [...document.querySelectorAll("body *")]
              .filter((element) => {
                const rect = element.getBoundingClientRect();
                const style = getComputedStyle(element);
                return (
                  rect.width > 0 &&
                  rect.height > 0 &&
                  rect.right > width + 1 &&
                  style.display !== "none" &&
                  style.visibility !== "hidden"
                );
              })
              .map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                  selector: selector(element),
                  right: Math.round(rect.right),
                  width: Math.round(rect.width),
                  text: element.textContent?.trim().slice(0, 140),
                };
              })
              .slice(0, 30)
          : [];
        return {
          viewport: { width: innerWidth, height: innerHeight },
          clientWidth: width,
          scrollWidth: document.documentElement.scrollWidth,
          hasOverflow,
          offenders,
          fontStatus: document.fonts.status,
          brokenImages: [...document.images]
            .filter((image) => !image.complete || image.naturalWidth === 0)
            .map((image) => ({
              src: image.currentSrc || image.src,
              alt: image.alt,
            })),
        };
      });
      const results = await new AxeBuilder({ page }).analyze();
      const result = {
        ...target,
        title: await page.title(),
        heading: await page.locator("main h1").innerText(),
        layout,
        runtime,
        axeVersion: results.testEngine.version,
        violations: results.violations,
        incomplete: results.incomplete,
        passedRuleIds: results.passes.map((rule) => rule.id),
      };
      report.results.push(result);
      console.log(
        JSON.stringify({
          device: target.device,
          route: target.route,
          violations: results.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            nodes: violation.nodes.length,
            selectors: violation.nodes.slice(0, 3).map((node) => node.target),
          })),
          horizontalOverflow: layout.hasOverflow,
          runtimeErrors: Object.values(runtime).reduce(
            (sum, value) => sum + value.length,
            0,
          ),
          brokenImages: layout.brokenImages.length,
        }),
      );
    } catch (error) {
      report.results.push({ ...target, scanError: error.message, runtime });
      console.error(`${target.device} ${target.route}: ${error.message}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  const violations = report.results.flatMap(
    (result) => result.violations ?? [],
  );
  report.summary = {
    pages: report.results.length,
    scanErrors: report.results.filter((result) => result.scanError).length,
    ruleOccurrences: violations.length,
    nodeOccurrences: violations.reduce(
      (sum, violation) => sum + violation.nodes.length,
      0,
    ),
    impacts: Object.fromEntries(
      ["critical", "serious", "moderate", "minor"].map((impact) => [
        impact,
        violations.filter((violation) => violation.impact === impact).length,
      ]),
    ),
    overflowPages: report.results
      .filter((result) => result.layout?.hasOverflow)
      .map((result) => `${result.device}:${result.route}`),
    runtimeErrorCount: report.results.reduce(
      (sum, result) =>
        sum +
        Object.values(result.runtime).reduce(
          (count, value) => count + value.length,
          0,
        ),
      0,
    ),
    brokenImageCount: report.results.reduce(
      (sum, result) => sum + (result.layout?.brokenImages.length ?? 0),
      0,
    ),
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ outputPath, summary: report.summary }, null, 2));
  if (
    report.summary.scanErrors ||
    violations.length ||
    report.summary.overflowPages.length ||
    report.summary.runtimeErrorCount ||
    report.summary.brokenImageCount
  )
    process.exitCode = 1;
}
