import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Smoke tests: sign in, the Tasks board, undo, privacy of dashboard pages.
// They run against a production build with a throwaway SQLite database
// (prisma/test.db, filled with the demo seed) and a test-only passcode, so
// they never touch real data. Run with `npm run test:e2e`.
const PORT = 3100;
export const PASSCODE = "e2e-test-passcode";
// Absolute on purpose. Prisma resolves a relative SQLite path against the folder the client
// was last generated from, and node_modules can be shared (symlinked) with other worktrees,
// so "file:./test.db" could open another checkout's test database.
export const TEST_DATABASE_URL = `file:${path.join(__dirname, "prisma", "test.db")}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://dash.localhost:${PORT}`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 950 }
  },
  // Jaber uses Safari: the AI Team tab also runs in WebKit, where a folded <details> drew empty.
  projects: [
    { name: "chromium" },
    { name: "safari", testMatch: /ai-team\.spec\.ts/, use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 950 }, serviceWorkers: "block" } }
  ],
  webServer: {
    command: `npx prisma db push --skip-generate --force-reset && npx tsx prisma/seed.ts && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      DASHBOARD_PASSWORD: PASSCODE,
      AUTH_SECRET: "e2e-only-signing-secret",
      TURSO_DATABASE_URL: "",
      BLOB_READ_WRITE_TOKEN: ""
    }
  }
});
