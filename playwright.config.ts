import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "e2e.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 35_000,
  expect: { timeout: 8_000 },
  outputDir: "./output/qa/test-results",
  reporter: [
    ["list"],
    ["html", { outputFolder: "output/qa/report", open: "never" }],
  ],
  globalTeardown: "./scripts/e2e-server.mjs",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4178",
    viewport: { width: 1440, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: "http://127.0.0.1:4178/api/health",
    reuseExistingServer: false,
    timeout: 30_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
  },
});
