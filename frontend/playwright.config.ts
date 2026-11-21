import { defineConfig, devices } from "@playwright/test";

// Runs against the real servers started by the scripts/start-backend and scripts/start-frontend scripts
export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: 120_000 },
  use: { baseURL: "http://localhost:3000", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
});
